export type CharStatus = 'absent' | 'present' | 'correct';

export type CharStatusMap = Record<string, CharStatus>;

export type AlertStatus = 'success' | 'error';

export type BoardState = {
  guesses: string[];
  solutionIndex: number | '';
};

export type GameStats = {
  winDistribution: number[];
  gamesFailed: number;
  currentStreak: number;
  bestStreak: number;
  totalGames: number;
  successRate: number;
};
