import { MAX_CHALLENGES } from 'constants/settings';

// The module derives `solution` at import time from the word list, so tests
// load a fresh copy of it with a known one-word list.
const loadWords = (solutionWord = 'react') => {
  let words;
  jest.isolateModules(() => {
    jest.doMock('constants/wordList', () => ({ WORDS: [solutionWord] }));
    words = require('./words');
  });
  return words;
};

afterEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
});

describe('isWordValid', () => {
  const { isWordValid } = loadWords();

  it('accepts a word from the guess list regardless of case', () => {
    expect(isWordValid('ABACK')).toBe(true);
    expect(isWordValid('aback')).toBe(true);
  });

  it('accepts the solution word', () => {
    expect(isWordValid('REACT')).toBe(true);
  });

  it('rejects a word that is in neither list', () => {
    expect(isWordValid('ZZZZZ')).toBe(false);
  });
});

describe('getGuessStatuses', () => {
  it('marks every letter of the solution as correct', () => {
    const { getGuessStatuses } = loadWords('react');

    expect(getGuessStatuses('REACT')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  it('marks misplaced letters as present and missing ones as absent', () => {
    const { getGuessStatuses } = loadWords('react');

    expect(getGuessStatuses('TRADE')).toEqual([
      'present',
      'present',
      'correct',
      'absent',
      'present',
    ]);
  });

  it('only marks as many duplicates as the solution contains', () => {
    const { getGuessStatuses } = loadWords('abbey');

    // solution has two B's, so the third B in the guess is absent
    expect(getGuessStatuses('BOBBY')).toEqual([
      'present',
      'absent',
      'correct',
      'absent',
      'correct',
    ]);
  });

  it('prefers a correct position over an earlier present one', () => {
    const { getGuessStatuses } = loadWords('reads');

    expect(getGuessStatuses('EERIE')).toEqual([
      'absent',
      'correct',
      'present',
      'absent',
      'absent',
    ]);
  });
});

describe('getStatuses', () => {
  it('returns an empty map when no guesses were made', () => {
    const { getStatuses } = loadWords('react');

    expect(getStatuses([])).toEqual({});
  });

  it('builds a keyboard status for every guessed letter', () => {
    const { getStatuses } = loadWords('react');

    expect(getStatuses(['TRADE'])).toEqual({
      T: 'present',
      R: 'present',
      A: 'correct',
      D: 'absent',
      E: 'present',
    });
  });

  it('never downgrades a letter that was already correct', () => {
    const { getStatuses } = loadWords('react');

    expect(getStatuses(['RIVER', 'REACT']).R).toBe('correct');
  });
});

describe('findFirstUnusedReveal', () => {
  it('returns false when no guess was made yet', () => {
    const { findFirstUnusedReveal } = loadWords('react');

    expect(findFirstUnusedReveal('TRADE', [])).toBe(false);
  });

  it('requires a correct letter to stay in its position', () => {
    const { findFirstUnusedReveal } = loadWords('react');

    expect(findFirstUnusedReveal('LEMON', ['TRADE'])).toBe(
      'Must use A in position 3'
    );
  });

  it('requires revealed letters to be reused', () => {
    const { findFirstUnusedReveal } = loadWords('react');

    expect(findFirstUnusedReveal('PLANK', ['TRADE'])).toBe(
      'Guess must contain T'
    );
  });

  it('returns false when the guess uses every revealed letter', () => {
    const { findFirstUnusedReveal } = loadWords('react');

    expect(findFirstUnusedReveal('REACT', ['TRADE'])).toBe(false);
  });

  it('only checks the most recent guess', () => {
    const { findFirstUnusedReveal } = loadWords('react');

    expect(findFirstUnusedReveal('CRATE', ['ZZZZZ'])).toBe(false);
  });
});

describe('addStatsForCompletedGame', () => {
  const emptyStats = () => ({
    winDistribution: Array.from(new Array(MAX_CHALLENGES), () => 0),
    gamesFailed: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGames: 0,
    successRate: 0,
  });

  it('records a win and extends the streak', () => {
    const { addStatsForCompletedGame } = loadWords();

    const updated = addStatsForCompletedGame(emptyStats(), 2);

    expect(updated).toMatchObject({
      totalGames: 1,
      gamesFailed: 0,
      currentStreak: 1,
      bestStreak: 1,
      successRate: 100,
    });
    expect(updated.winDistribution[2]).toBe(1);
  });

  it('records a loss and resets the current streak', () => {
    const { addStatsForCompletedGame } = loadWords();
    const won = addStatsForCompletedGame(emptyStats(), 1);

    const lost = addStatsForCompletedGame(won, MAX_CHALLENGES);

    expect(lost).toMatchObject({
      totalGames: 2,
      gamesFailed: 1,
      currentStreak: 0,
      bestStreak: 1,
      successRate: 50,
    });
  });
});

describe('generateEmojiGrid', () => {
  it('renders one emoji row per guess', () => {
    const { generateEmojiGrid } = loadWords('react');

    expect(generateEmojiGrid(['TRADE', 'REACT'])).toBe(
      '🟨🟨🟩⬜🟨\n🟩🟩🟩🟩🟩'
    );
  });
});

describe('shareStatus', () => {
  it('copies the result and the emoji grid to the clipboard', () => {
    const { shareStatus, solutionIndex } = loadWords('react');
    const writeText = jest.fn();
    Object.assign(navigator, { clipboard: { writeText } });

    shareStatus(['REACT'], false, true);

    const [text] = writeText.mock.calls[0];
    expect(text).toContain(`#${solutionIndex}`);
    expect(text).toContain(`1/${MAX_CHALLENGES}`);
    expect(text).toContain('Hard Mode');
    expect(text).toContain('🟩🟩🟩🟩🟩');
  });

  it('shares an X and no hard mode label for a lost game', () => {
    const { shareStatus } = loadWords('react');
    const writeText = jest.fn();
    Object.assign(navigator, { clipboard: { writeText } });

    shareStatus(['TRADE'], true, false);

    const [text] = writeText.mock.calls[0];
    expect(text).toContain(`X/${MAX_CHALLENGES}`);
    expect(text).not.toContain('Hard Mode');
  });
});

describe('getWordOfDay', () => {
  it('picks the word for the current day and the next midnight', () => {
    const { getWordOfDay } = loadWords('react');
    const epochMs = new Date(2022, 0).valueOf();
    const msInDay = 86400000;
    jest.spyOn(Date, 'now').mockReturnValue(epochMs + msInDay * 3.5);

    expect(getWordOfDay()).toEqual({
      solution: 'react',
      solutionIndex: 3,
      tomorrow: epochMs + msInDay * 4,
    });
  });
});
