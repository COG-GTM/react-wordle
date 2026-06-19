import confetti from 'canvas-confetti';

export function fireConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    angle: 60,
    origin: { x: 0, y: 0.6 },
  });

  confetti({
    particleCount: 100,
    spread: 70,
    angle: 120,
    origin: { x: 1, y: 0.6 },
  });
}
