import {
  getGuessStatuses,
  getStatuses,
  generateEmojiGrid,
  findFirstUnusedReveal,
} from './words';

test('getGuessStatuses uses the given solution', () => {
  expect(getGuessStatuses('CRANE', 'crane')).toEqual([
    'correct',
    'correct',
    'correct',
    'correct',
    'correct',
  ]);
  expect(getGuessStatuses('CRANE', 'nicer')).toEqual([
    'present',
    'present',
    'absent',
    'present',
    'present',
  ]);
});

test('getStatuses uses the given solution', () => {
  expect(getStatuses(['CRANE'], 'nicer')).toEqual({
    C: 'present',
    R: 'present',
    A: 'absent',
    N: 'present',
    E: 'present',
  });
});

test('generateEmojiGrid uses the given solution', () => {
  expect(generateEmojiGrid(['CRANE'], 'crane')).toBe('🟩🟩🟩🟩🟩');
  expect(generateEmojiGrid(['CRANE'], 'nicer')).toBe('🟨🟨⬜🟨🟨');
});

test('findFirstUnusedReveal uses the given solution', () => {
  expect(findFirstUnusedReveal('SHINE', ['CRANE'], 'nicer')).toBe(
    'Guess must contain C'
  );
  expect(findFirstUnusedReveal('CRANE', ['CRANE'], 'crane')).toBe(false);
});
