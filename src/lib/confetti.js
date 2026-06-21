import confetti from 'canvas-confetti';

const DEFAULTS = {
  particleCount: 80,
  spread: 70,
  startVelocity: 45,
  ticks: 200,
};

export function fireConfetti() {
  confetti({
    ...DEFAULTS,
    angle: 60,
    origin: { x: 0, y: 0.6 },
  });

  confetti({
    ...DEFAULTS,
    angle: 120,
    origin: { x: 1, y: 0.6 },
  });
}
