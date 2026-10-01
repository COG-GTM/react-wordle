import confetti from 'canvas-confetti';

export const fireConfetti = () => {
  const end = Date.now() + 1500;
  const defaults = { startVelocity: 45, spread: 70, ticks: 200, zIndex: 1000 };

  confetti({
    ...defaults,
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
  });

  (function frame() {
    confetti({ ...defaults, particleCount: 4, angle: 60, origin: { x: 0 } });
    confetti({ ...defaults, particleCount: 4, angle: 120, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
};
