import { useEffect, useState } from 'react';

const readTimer = solutionIndex => {
  try {
    const saved = JSON.parse(localStorage.getItem('gameTimer'));
    if (
      saved?.solutionIndex === solutionIndex &&
      Number.isFinite(saved.startedAt) &&
      saved.startedAt >= 0 &&
      (saved.endedAt === null ||
        (Number.isFinite(saved.endedAt) && saved.endedAt >= saved.startedAt))
    ) {
      return saved;
    }
  } catch {
    // A missing or invalid timer should not prevent playing.
  }

  return null;
};

const reconcileTimers = (timer, saved) => {
  if (!timer) return saved;
  if (!saved) return timer;

  const startedAt = Math.min(timer.startedAt, saved.startedAt);
  const endedAt =
    timer.endedAt === null
      ? saved.endedAt
      : saved.endedAt === null
      ? timer.endedAt
      : Math.min(timer.endedAt, saved.endedAt);

  return startedAt === timer.startedAt && endedAt === timer.endedAt
    ? timer
    : { ...timer, startedAt, endedAt };
};

const useGameTimer = (solutionIndex, isGameOver) => {
  const [timer, setTimer] = useState(
    () =>
      readTimer(solutionIndex) ??
      (isGameOver
        ? null
        : { solutionIndex, startedAt: Date.now(), endedAt: null })
  );
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!timer) return;

    const saved = readTimer(solutionIndex);
    const reconciled = reconcileTimers(timer, saved);
    const updated =
      isGameOver && reconciled.endedAt === null
        ? { ...reconciled, endedAt: Date.now() }
        : reconciled;

    if (updated !== timer) setTimer(updated);

    try {
      if (
        saved?.startedAt !== updated.startedAt ||
        saved?.endedAt !== updated.endedAt
      ) {
        localStorage.setItem('gameTimer', JSON.stringify(updated));
      }
    } catch {
      // Keep timing in memory if browser storage is unavailable.
    }
  }, [timer, isGameOver, solutionIndex]);

  useEffect(() => {
    const syncTimer = event => {
      if (event.key !== 'gameTimer') return;
      const saved = readTimer(solutionIndex);
      if (saved) setTimer(current => reconcileTimers(current, saved));
    };

    window.addEventListener('storage', syncTimer);
    return () => window.removeEventListener('storage', syncTimer);
  }, [solutionIndex]);

  useEffect(() => {
    if (!timer || timer.endedAt !== null || isGameOver) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timer, isGameOver]);

  return timer ? Math.max(0, (timer.endedAt ?? now) - timer.startedAt) : null;
};

export default useGameTimer;
