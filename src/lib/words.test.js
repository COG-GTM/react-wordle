import { MAX_CHALLENGES } from 'constants/settings';

// Mock constants/wordList so that getWordOfDay() (evaluated at module load)
// always produces a known solution. With a single-element array, the solution
// is always that element regardless of the current date.
jest.mock('constants/wordList', () => ({
  WORDS: ['heart'],
}));

// Import AFTER the mock is set up (jest.mock is hoisted automatically)
const {
  isWordValid,
  getGuessStatuses,
  getStatuses,
  findFirstUnusedReveal,
  addStatsForCompletedGame,
  generateEmojiGrid,
  getWordOfDay,
  solution,
} = require('lib/words');

// ─── isWordValid ────────────────────────────────────────────────────────────

describe('isWordValid', () => {
  test('returns true for a word in VALID_GUESSES', () => {
    expect(isWordValid('aahed')).toBe(true);
  });

  test('returns true for a word in WORDS', () => {
    expect(isWordValid('heart')).toBe(true);
  });

  test('returns false for a random non-word string', () => {
    expect(isWordValid('zzzzz')).toBe(false);
    expect(isWordValid('xqjkw')).toBe(false);
  });

  test('is case-insensitive', () => {
    expect(isWordValid('HEART')).toBe(true);
    expect(isWordValid('Heart')).toBe(true);
    expect(isWordValid('AAHED')).toBe(true);
  });
});

// ─── getGuessStatuses ───────────────────────────────────────────────────────
// solution is 'heart'

describe('getGuessStatuses', () => {
  test('all correct: guess matches solution', () => {
    const statuses = getGuessStatuses('heart');
    expect(statuses).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  test('all absent: guess has no letters in solution', () => {
    // 'lumps' shares no letters with 'heart'
    const statuses = getGuessStatuses('lumps');
    expect(statuses).toEqual([
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ]);
  });

  test('mixed: some correct, some present, some absent', () => {
    // solution = 'heart'
    // guess    = 'haste'
    // h=correct, a=present, s=absent, t=present, e=present
    const statuses = getGuessStatuses('haste');
    expect(statuses).toEqual([
      'correct',
      'present',
      'absent',
      'present',
      'present',
    ]);
  });

  test('duplicate letters: repeated letters handled correctly', () => {
    // solution = 'heart'
    // guess    = 'eerie'
    // First pass (correct): pos 1 e=correct
    // Second pass:
    // pos 0: e -> find untaken e -> pos 1 taken -> none left -> absent
    // pos 2: r -> find untaken r -> pos 3 untaken -> present
    // pos 3: i -> i not in solution -> absent
    // pos 4: e -> find untaken e -> pos 1 taken -> none left -> absent
    const statuses = getGuessStatuses('eerie');
    expect(statuses).toEqual([
      'absent',
      'correct',
      'present',
      'absent',
      'absent',
    ]);
  });

  test('letter present once but guessed twice: first occurrence present, second absent', () => {
    // solution = 'heart'
    // guess    = 'teeth'
    // First pass (correct): pos 1 e=correct
    // Second pass:
    // pos 0: t -> find untaken t in solution -> pos 4 untaken -> present, mark pos 4 taken
    // pos 2: e -> find untaken e -> pos 1 taken -> absent
    // pos 3: t -> find untaken t -> pos 4 taken -> absent
    // pos 4: h -> find untaken h -> pos 0 untaken -> present
    const statuses = getGuessStatuses('teeth');
    expect(statuses).toEqual([
      'present',
      'correct',
      'absent',
      'absent',
      'present',
    ]);
  });
});

// ─── getStatuses ────────────────────────────────────────────────────────────
// solution is 'heart' (uppercase HEART)

describe('getStatuses', () => {
  test('returns an object mapping uppercase letters to correct/present/absent', () => {
    // solution = HEART
    // guess = 'HASTE'
    // H at pos 0 -> solution[0]=H -> correct
    // A at pos 1 -> solution[1]=E -> not correct, A in solution -> present
    // S at pos 2 -> S not in solution -> absent
    // T at pos 3 -> solution[3]=R -> not correct, T in solution -> present
    // E at pos 4 -> solution[4]=T -> not correct, E in solution -> present
    const result = getStatuses(['HASTE']);
    expect(result).toEqual({
      H: 'correct',
      A: 'present',
      S: 'absent',
      T: 'present',
      E: 'present',
    });
  });

  test('correct takes priority over present for the same letter across guesses', () => {
    // First guess 'HASTE': T=present
    // Second guess 'HEART': T=correct (pos 4)
    const result = getStatuses(['HASTE', 'HEART']);
    expect(result.T).toBe('correct');
    expect(result.H).toBe('correct');
  });
});

// ─── findFirstUnusedReveal ──────────────────────────────────────────────────
// solution is 'heart'

describe('findFirstUnusedReveal', () => {
  test('returns false when guesses array is empty', () => {
    expect(findFirstUnusedReveal('BEAST', [])).toBe(false);
  });

  test('returns false when new word uses all revealed letters correctly', () => {
    expect(findFirstUnusedReveal('HEART', ['HEART'])).toBe(false);
  });

  test('returns position error message when a correct letter is not in the right spot', () => {
    // Previous guess: HEART -> all correct
    // New word: TEARS -> H should be at pos 0 but T is there
    const result = findFirstUnusedReveal('TEARS', ['HEART']);
    expect(result).toContain('Must use');
    expect(result).toContain('H');
  });

  test('returns "Guess must contain X" when a revealed letter is missing', () => {
    // Previous guess: HASTE
    // solution=heart: h=correct, a=present, s=absent, t=present, e=present
    // New word: HOOKS -> H at pos 0 (good), but missing A, T, E
    const result = findFirstUnusedReveal('HOOKS', ['HASTE']);
    expect(result).toContain('Guess must contain');
  });
});

// ─── addStatsForCompletedGame ───────────────────────────────────────────────

describe('addStatsForCompletedGame', () => {
  const makeBaseStats = () => ({
    winDistribution: [0, 0, 0, 0, 0, 0],
    gamesFailed: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGames: 0,
    successRate: 0,
  });

  test('winning game: increments totalGames, updates winDistribution, increments currentStreak, updates bestStreak', () => {
    const result = addStatsForCompletedGame(makeBaseStats(), 2);
    expect(result.totalGames).toBe(1);
    expect(result.winDistribution[2]).toBe(1);
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(1);
  });

  test('losing game: increments totalGames, increments gamesFailed, resets currentStreak to 0', () => {
    const statsWithStreak = {
      ...makeBaseStats(),
      totalGames: 5,
      currentStreak: 3,
      bestStreak: 3,
    };
    const result = addStatsForCompletedGame(statsWithStreak, MAX_CHALLENGES);
    expect(result.totalGames).toBe(6);
    expect(result.gamesFailed).toBe(1);
    expect(result.currentStreak).toBe(0);
  });

  test('computes successRate correctly', () => {
    const stats = {
      ...makeBaseStats(),
      totalGames: 9,
      gamesFailed: 1,
    };
    const result = addStatsForCompletedGame(stats, 0);
    expect(result.successRate).toBe(90);
  });

  test('does not mutate the input stats object (top-level properties)', () => {
    const original = makeBaseStats();
    const originalTotalGames = original.totalGames;
    const originalCurrentStreak = original.currentStreak;
    const originalBestStreak = original.bestStreak;
    const originalGamesFailed = original.gamesFailed;
    const originalSuccessRate = original.successRate;
    addStatsForCompletedGame(original, 0);
    // The spread operator creates a new object, so top-level primitives are not mutated
    expect(original.totalGames).toBe(originalTotalGames);
    expect(original.currentStreak).toBe(originalCurrentStreak);
    expect(original.bestStreak).toBe(originalBestStreak);
    expect(original.gamesFailed).toBe(originalGamesFailed);
    expect(original.successRate).toBe(originalSuccessRate);
  });
});

// ─── generateEmojiGrid ─────────────────────────────────────────────────────
// solution is 'heart'

describe('generateEmojiGrid', () => {
  test('returns correct emoji strings for correct, present, absent', () => {
    const result = generateEmojiGrid(['heart']);
    expect(result).toBe(
      '\uD83D\uDFE9\uD83D\uDFE9\uD83D\uDFE9\uD83D\uDFE9\uD83D\uDFE9'
    );
  });

  test('multiple guesses produce newline-separated rows', () => {
    // 'lumps' -> all absent, 'heart' -> all correct
    const result = generateEmojiGrid(['lumps', 'heart']);
    const rows = result.split('\n');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toBe('\u2B1C\u2B1C\u2B1C\u2B1C\u2B1C');
    expect(rows[1]).toBe(
      '\uD83D\uDFE9\uD83D\uDFE9\uD83D\uDFE9\uD83D\uDFE9\uD83D\uDFE9'
    );
  });
});

// ─── getWordOfDay ───────────────────────────────────────────────────────────

describe('getWordOfDay', () => {
  test('returns an object with solution, solutionIndex, and tomorrow keys', () => {
    const result = getWordOfDay();
    expect(result).toHaveProperty('solution');
    expect(result).toHaveProperty('solutionIndex');
    expect(result).toHaveProperty('tomorrow');
  });

  test('solution is a string from the WORDS list', () => {
    const result = getWordOfDay();
    expect(typeof result.solution).toBe('string');
    expect(result.solution).toBe('heart');
  });

  test('solutionIndex is a non-negative integer', () => {
    const result = getWordOfDay();
    expect(Number.isInteger(result.solutionIndex)).toBe(true);
    expect(result.solutionIndex).toBeGreaterThanOrEqual(0);
  });

  test('tomorrow is greater than Date.now()', () => {
    const result = getWordOfDay();
    expect(result.tomorrow).toBeGreaterThan(Date.now());
  });
});
