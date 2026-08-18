import {
  getRandomWord,
  getGuessStatuses,
  getStatuses,
  generateEmojiGrid,
  isWordValid,
} from './words';
import { WORDS } from 'constants/wordList';

describe('getRandomWord', () => {
  it('returns a valid word from the solutions list', () => {
    for (let i = 0; i < 20; i++) {
      const { solution, solutionIndex } = getRandomWord();
      expect(WORDS).toContain(solution);
      expect(solutionIndex).toBeNull();
    }
  });

  it('never repeats the current solution', () => {
    const current = WORDS[0];
    for (let i = 0; i < 50; i++) {
      expect(getRandomWord(current).solution).not.toBe(current);
    }
  });

  it('returns different words over many draws', () => {
    const draws = new Set(
      Array.from({ length: 100 }, () => getRandomWord().solution)
    );
    expect(draws.size).toBeGreaterThan(1);
  });
});

describe('getGuessStatuses', () => {
  it('computes statuses against the provided solution', () => {
    expect(getGuessStatuses('CRANE', 'crane')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
    expect(getGuessStatuses('CRANE', 'nacre')).toEqual([
      'present',
      'present',
      'present',
      'present',
      'correct',
    ]);
  });

  it('uses the runtime solution, not a fixed daily word', () => {
    expect(getGuessStatuses('ABCDE', 'fghij')).toEqual([
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ]);
  });
});

describe('getStatuses', () => {
  it('maps keyboard letters against the provided solution', () => {
    const statuses = getStatuses(['CRANE'], 'crown');

    expect(statuses['C']).toBe('correct');
    expect(statuses['R']).toBe('correct');
    expect(statuses['A']).toBe('absent');
    expect(statuses['N']).toBe('present');
    expect(statuses['E']).toBe('absent');
  });
});

describe('generateEmojiGrid', () => {
  it('generates the grid for the provided solution', () => {
    expect(generateEmojiGrid(['CRANE'], 'crane')).toBe('🟩🟩🟩🟩🟩');
    expect(generateEmojiGrid(['CRANE'], 'crown')).toBe('🟩🟩⬜🟨⬜');
  });
});

describe('isWordValid', () => {
  it('accepts words from the solution list', () => {
    expect(isWordValid(WORDS[0])).toBe(true);
  });

  it('rejects non-words', () => {
    expect(isWordValid('zzzzz')).toBe(false);
  });
});
