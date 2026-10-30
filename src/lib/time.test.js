import { formatElapsedTime } from './time';

test.each([
  [0, '00:00'],
  [59999, '00:59'],
  [60000, '01:00'],
  [3599999, '59:59'],
  [3600000, '01:00:00'],
  [90061000, '25:01:01'],
  [null, '—'],
])('formats %s milliseconds as %s', (milliseconds, expected) => {
  expect(formatElapsedTime(milliseconds)).toBe(expected);
});
