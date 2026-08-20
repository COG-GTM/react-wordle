import {
  getRandomWord,
  getGuessStatuses,
  addStatsForCompletedGame,
  generateEmojiGrid,
} from 'lib/words';
import { WORDS } from 'constants/wordList';
import { MAX_CHALLENGES } from 'constants/settings';

describe('getRandomWord', () => {
  it('returns a word from the solutions list', () => {
    for (let i = 0; i < 20; i++) {
      expect(WORDS).toContain(getRandomWord());
    }
  });

  it('returns a 5-letter word', () => {
    expect(getRandomWord()).toHaveLength(5);
  });
});

describe('getGuessStatuses', () => {
  it('evaluates guesses against the provided solution at runtime', () => {
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
});

describe('generateEmojiGrid', () => {
  it('uses the provided solution', () => {
    expect(generateEmojiGrid(['CRANE'], 'crane')).toBe('🟩🟩🟩🟩🟩');
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

  it('does not mutate the stats object it receives', () => {
    const stats = emptyStats();
    const updated = addStatsForCompletedGame(stats, 2);
    expect(stats.totalGames).toBe(0);
    expect(updated.totalGames).toBe(1);
  });
});
