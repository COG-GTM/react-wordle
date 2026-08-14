import {
  getRandomWord,
  getGuessStatuses,
  addStatsForCompletedGame,
  generateEmojiGrid,
} from 'lib/words';
import { WORDS } from 'constants/wordList';
import { MAX_CHALLENGES } from 'constants/settings';

describe('getRandomWord', () => {
  test('returns a word from the solutions list', () => {
    for (let i = 0; i < 20; i++) {
      expect(WORDS).toContain(getRandomWord());
    }
  });

  test('returns different words across many draws', () => {
    const draws = new Set(Array.from({ length: 100 }, () => getRandomWord()));
    expect(draws.size).toBeGreaterThan(1);
  });
});

describe('getGuessStatuses', () => {
  test('evaluates a guess against the provided solution', () => {
    expect(getGuessStatuses('CIGAR', 'cigar')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
    expect(getGuessStatuses('RIGAC', 'cigar')).toEqual([
      'present',
      'correct',
      'correct',
      'correct',
      'present',
    ]);
  });

  test('same guess gives different results for different solutions', () => {
    expect(getGuessStatuses('CIGAR', 'cigar')).not.toEqual(
      getGuessStatuses('CIGAR', 'rebut')
    );
  });
});

describe('generateEmojiGrid', () => {
  test('uses the provided solution', () => {
    expect(generateEmojiGrid(['CIGAR'], 'cigar')).toBe('🟩🟩🟩🟩🟩');
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

  test('records a win', () => {
    const stats = addStatsForCompletedGame(emptyStats(), 2);
    expect(stats.totalGames).toBe(1);
    expect(stats.currentStreak).toBe(1);
    expect(stats.winDistribution[2]).toBe(1);
  });

  test('records a loss', () => {
    const stats = addStatsForCompletedGame(emptyStats(), MAX_CHALLENGES);
    expect(stats.gamesFailed).toBe(1);
    expect(stats.currentStreak).toBe(0);
  });
});
