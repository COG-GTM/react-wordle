import {
  getRandomWord,
  getGuessStatuses,
  generateEmojiGrid,
  shareStatus,
  addStatsForCompletedGame,
} from 'lib/words';
import { WORDS } from 'constants/wordList';
import { MAX_CHALLENGES } from 'constants/settings';

describe('getRandomWord', () => {
  test('returns a word from the solutions list', () => {
    for (let i = 0; i < 50; i++) {
      expect(WORDS).toContain(getRandomWord());
    }
  });

  test('returns different words over many calls', () => {
    const results = new Set();
    for (let i = 0; i < 100; i++) {
      results.add(getRandomWord());
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('getGuessStatuses', () => {
  test('computes statuses against the provided solution', () => {
    expect(getGuessStatuses('CIGAR', 'cigar')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
    expect(getGuessStatuses('RIGID', 'cigar')).toEqual([
      'present',
      'correct',
      'correct',
      'absent',
      'absent',
    ]);
  });

  test('different solutions produce different statuses for the same guess', () => {
    expect(getGuessStatuses('CIGAR', 'cigar')).not.toEqual(
      getGuessStatuses('CIGAR', 'robin')
    );
  });
});

describe('generateEmojiGrid', () => {
  test('uses the provided solution', () => {
    expect(generateEmojiGrid(['CIGAR'], 'cigar')).toBe('🟩🟩🟩🟩🟩');
  });
});

describe('shareStatus', () => {
  let clipboardText;

  beforeEach(() => {
    clipboardText = '';
    Object.assign(navigator, {
      clipboard: {
        writeText: text => {
          clipboardText = text;
        },
      },
    });
  });

  test('includes the day index for daily games', () => {
    shareStatus(['CIGAR'], false, false, 'cigar', 42);
    expect(clipboardText).toContain('#42');
  });

  test('omits the day index for unlimited games', () => {
    shareStatus(['CIGAR'], false, false, 'cigar', null);
    expect(clipboardText).not.toContain('#');
    expect(clipboardText).toContain('Unlimited');
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

  test('does not mutate the input stats object', () => {
    const stats = emptyStats();
    addStatsForCompletedGame(stats, 2);
    expect(stats.totalGames).toBe(0);
  });
});
