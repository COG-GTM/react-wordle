import {
  getRandomWord,
  getGuessStatuses,
  getStatuses,
  generateEmojiGrid,
  addStatsForCompletedGame,
} from 'lib/words';
import { WORDS } from 'constants/wordList';
import { MAX_CHALLENGES } from 'constants/settings';

describe('getRandomWord', () => {
  test('returns a word from the solutions list with a matching index', () => {
    for (let i = 0; i < 50; i++) {
      const { solution, solutionIndex } = getRandomWord();
      expect(WORDS).toContain(solution);
      expect(WORDS[solutionIndex]).toBe(solution);
    }
  });
});

describe('runtime solution parameter', () => {
  test('getGuessStatuses evaluates against the provided solution', () => {
    expect(getGuessStatuses('crane', 'crane')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
    expect(getGuessStatuses('nacre', 'crane')).toEqual([
      'present',
      'present',
      'present',
      'present',
      'correct',
    ]);
  });

  test('getStatuses evaluates against the provided solution', () => {
    expect(getStatuses(['CRANE'], 'crane')).toEqual({
      C: 'correct',
      R: 'correct',
      A: 'correct',
      N: 'correct',
      E: 'correct',
    });
    expect(getStatuses(['CRANE'], 'zzzzz')).toEqual({
      C: 'absent',
      R: 'absent',
      A: 'absent',
      N: 'absent',
      E: 'absent',
    });
  });

  test('generateEmojiGrid uses the provided solution', () => {
    expect(generateEmojiGrid(['CRANE'], 'crane')).toBe('🟩🟩🟩🟩🟩');
    expect(generateEmojiGrid(['CRANE'], 'zzzzz')).toBe('⬜⬜⬜⬜⬜');
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

  test('does not mutate the passed stats object', () => {
    const stats = emptyStats();
    addStatsForCompletedGame(stats, 2);
    expect(stats.totalGames).toBe(0);
  });

  test('separate buckets stay isolated', () => {
    const daily = emptyStats();
    const practice = addStatsForCompletedGame(emptyStats(), 2);
    expect(practice.totalGames).toBe(1);
    expect(daily.totalGames).toBe(0);
    expect(daily.currentStreak).toBe(0);
  });
});
