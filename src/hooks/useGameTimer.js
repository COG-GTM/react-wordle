import { useEffect, useState } from 'react';

const loadTimer = (solutionIndex, isGameOver) => {
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

  return isGameOver
    ? null
    : { solutionIndex, startedAt: Date.now(), endedAt: null };
};

const useGameTimer = (solutionIndex, isGameOver) => {
  const [timer, setTimer] = useState(() =>
    loadTimer(solutionIndex, isGameOver)
  );
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!timer) return;

    const updated =
      isGameOver && timer.endedAt === null
        ? { ...timer, endedAt: Date.now() }
        : timer;

    if (updated !== timer) setTimer(updated);

    try {
      localStorage.setItem('gameTimer', JSON.stringify(updated));
    } catch {
      // Keep timing in memory if browser storage is unavailable.
    }
  }, [timer, isGameOver]);

  useEffect(() => {
    if (!timer || timer.endedAt !== null || isGameOver) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timer, isGameOver]);

  return timer ? Math.max(0, (timer.endedAt ?? now) - timer.startedAt) : null;
};

export default useGameTimer;
