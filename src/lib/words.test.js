import {
  getRandomWord,
  getGuessStatuses,
  getStatuses,
  findFirstUnusedReveal,
  addStatsForCompletedGame,
  generateEmojiGrid,
  getWordOfDay,
} from 'lib/words';
import { WORDS } from 'constants/wordList';
import { MAX_CHALLENGES } from 'constants/settings';

describe('getRandomWord', () => {
  it('returns a word from the solutions list', () => {
    for (let i = 0; i < 20; i++) {
      expect(WORDS).toContain(getRandomWord());
    }
  });
});

describe('getWordOfDay', () => {
  it('is deterministic for a given date', () => {
    const first = getWordOfDay();
    const second = getWordOfDay();

    expect(first.solution).toBe(second.solution);
    expect(first.solutionIndex).toBe(second.solutionIndex);
  });
});

describe('getGuessStatuses', () => {
  it('computes statuses against the provided solution', () => {
    expect(getGuessStatuses('CIGAR', 'cigar')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
    expect(getGuessStatuses('RANGE', 'cigar')).toEqual([
      'present',
      'present',
      'absent',
      'present',
      'absent',
    ]);
  });

  it('produces different results for different solutions', () => {
    expect(getGuessStatuses('CIGAR', 'cigar')).not.toEqual(
      getGuessStatuses('CIGAR', 'rebut')
    );
  });
});

describe('getStatuses', () => {
  it('computes keyboard statuses against the provided solution', () => {
    expect(getStatuses(['CIGAR'], 'cigar')).toEqual({
      C: 'correct',
      I: 'correct',
      G: 'correct',
      A: 'correct',
      R: 'correct',
    });
  });
});

describe('findFirstUnusedReveal', () => {
  it('enforces revealed letters against the provided solution', () => {
    expect(findFirstUnusedReveal('MOUNT', ['CIGAR'], 'cigar')).toBe(
      'Must use C in position 1'
    );
    expect(findFirstUnusedReveal('MOUNT', [], 'cigar')).toBe(false);
  });
});

describe('generateEmojiGrid', () => {
  it('uses the provided solution for the emoji grid', () => {
    expect(generateEmojiGrid(['CIGAR'], 'cigar')).toBe('🟩🟩🟩🟩🟩');
    expect(generateEmojiGrid(['CIGAR'], 'mount')).toBe('⬜⬜⬜⬜⬜');
  });
});

describe('addStatsForCompletedGame', () => {
  const initialStats = () => ({
    winDistribution: Array.from(new Array(MAX_CHALLENGES), () => 0),
    gamesFailed: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGames: 0,
    successRate: 0,
  });

  it('does not mutate the stats object passed in', () => {
    const daily = initialStats();
    const practice = addStatsForCompletedGame(daily, 2);

    expect(practice.totalGames).toBe(1);
    expect(practice.winDistribution[2]).toBe(1);
    expect(daily.totalGames).toBe(0);
    expect(daily.currentStreak).toBe(0);
    expect(daily.winDistribution[2]).toBe(0);
  });
});
