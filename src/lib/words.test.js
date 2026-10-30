import { WORDS } from 'constants/wordList';
import {
  createPracticeGame,
  getGuessStatuses,
  getStatuses,
  findFirstUnusedReveal,
  solution,
} from './words';

test('creates empty practice games from the full solutions list', () => {
  const random = jest.spyOn(Math, 'random');
  random.mockReturnValue(0);
  expect(createPracticeGame()).toEqual({ solution: WORDS[0], guesses: [] });
  random.mockReturnValue(0.999999);
  expect(createPracticeGame().solution).toBe(WORDS[WORDS.length - 1]);
  random.mockRestore();
});

test('scores and enforces hints against the selected practice word', () => {
  expect(getGuessStatuses('APPLE', 'apple')).toEqual(Array(5).fill('correct'));
  expect(getStatuses(['APPLE'], 'apple').A).toBe('correct');
  expect(findFirstUnusedReveal('BRICK', ['APPLE'], 'apple')).toBe(
    'Must use A in position 1'
  );
  expect(findFirstUnusedReveal('BRICK', [], 'apple')).toBe(false);
  expect(getGuessStatuses(solution)).toEqual(Array(5).fill('correct'));
});
