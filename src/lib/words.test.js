import { WORDS } from 'constants/wordList';
import {
  getGuessStatuses,
  getRandomWord,
  getStatuses,
  getWordOfDay,
  findFirstUnusedReveal,
  generateEmojiGrid,
} from './words';

describe('getRandomWord', () => {
  it('returns a word from the solutions list with its index', () => {
    const { solution, solutionIndex } = getRandomWord();

    expect(WORDS).toContain(solution);
    expect(WORDS[solutionIndex]).toBe(solution);
  });

  it('does not always return the word of the day', () => {
    const { solution: dailyWord } = getWordOfDay();
    const words = Array.from(new Array(50), () => getRandomWord().solution);

    expect(words.some(word => word !== dailyWord)).toBe(true);
  });
});

describe('getWordOfDay', () => {
  it('returns the same word for the same date', () => {
    expect(getWordOfDay()).toEqual(getWordOfDay());
  });
});

describe('statuses', () => {
  it('scores a guess against the given solution', () => {
    expect(getGuessStatuses('CRANE', 'crane')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
    expect(getGuessStatuses('EAGLE', 'crane')).toEqual([
      'absent',
      'present',
      'absent',
      'absent',
      'correct',
    ]);
  });

  it('scores keyboard letters against the given solution', () => {
    expect(getStatuses(['EAGLE'], 'crane')).toEqual({
      E: 'correct',
      A: 'present',
      G: 'absent',
      L: 'absent',
    });
  });
});

describe('findFirstUnusedReveal', () => {
  it('requires revealed letters of the given solution', () => {
    expect(findFirstUnusedReveal('MOIST', ['EAGLE'], 'crane')).toBe(
      'Must use E in position 5'
    );
    expect(findFirstUnusedReveal('EAGLE', ['EAGLE'], 'crane')).toBe(false);
  });
});

describe('generateEmojiGrid', () => {
  it('builds the grid from the given solution', () => {
    expect(generateEmojiGrid(['CRANE'], 'crane')).toBe('🟩🟩🟩🟩🟩');
  });
});
