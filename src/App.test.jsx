import {
  render as rtlRender,
  screen,
  fireEvent,
  act,
} from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';
import { solutionIndex } from 'lib/words';

const render = ui => rtlRender(<AlertProvider>{ui}</AlertProvider>);

const typeWord = word => {
  word.split('').forEach(letter => {
    fireEvent.keyDown(window, { key: letter });
  });
  fireEvent.keyDown(window, { key: 'Enter' });
};

beforeEach(() => {
  jest.useFakeTimers();
  window.localStorage.clear();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

test('renders daily mode by default without the Unlimited indicator', () => {
  render(<App />);
  expect(screen.getByText('WORDLE')).toBeInTheDocument();
  expect(screen.queryByText('Unlimited')).not.toBeInTheDocument();
});

test('shows the Unlimited indicator when gameMode is unlimited', () => {
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  render(<App />);
  expect(screen.getByText('Unlimited')).toBeInTheDocument();
});

test('persisted gameMode survives reload', () => {
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  const { unmount } = render(<App />);
  unmount();
  render(<App />);
  expect(screen.getByText('Unlimited')).toBeInTheDocument();
});

test('unlimited play never touches daily boardState or gameStats', () => {
  const dailyBoard = { guesses: ['WHICH'], solutionIndex };
  const dailyStats = {
    winDistribution: [0, 1, 0, 0, 0, 0],
    gamesFailed: 0,
    currentStreak: 1,
    bestStreak: 1,
    totalGames: 1,
    successRate: 100,
  };
  window.localStorage.setItem('boardState', JSON.stringify(dailyBoard));
  window.localStorage.setItem('gameStats', JSON.stringify(dailyStats));
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  window.localStorage.setItem(
    'unlimitedState',
    JSON.stringify({ guesses: [], solution: 'crane' })
  );

  render(<App />);

  typeWord('CRANE');

  expect(JSON.parse(window.localStorage.getItem('boardState'))).toEqual(
    dailyBoard
  );
  expect(JSON.parse(window.localStorage.getItem('gameStats'))).toEqual(
    dailyStats
  );

  const practiceStats = JSON.parse(
    window.localStorage.getItem('practiceStats')
  );
  expect(practiceStats.totalGames).toBe(1);
  expect(practiceStats.currentStreak).toBe(1);

  const unlimitedState = JSON.parse(
    window.localStorage.getItem('unlimitedState')
  );
  expect(unlimitedState.guesses).toEqual(['CRANE']);
  expect(unlimitedState.solution).toBe('crane');
});

test('daily play never touches practiceStats or unlimitedState', () => {
  const unlimited = { guesses: ['CRANE'], solution: 'crane' };
  window.localStorage.setItem('gameMode', JSON.stringify('daily'));
  window.localStorage.setItem('unlimitedState', JSON.stringify(unlimited));

  render(<App />);

  typeWord('WHICH');

  expect(JSON.parse(window.localStorage.getItem('unlimitedState'))).toEqual(
    unlimited
  );
  expect(window.localStorage.getItem('practiceStats')).toBeNull();

  const boardState = JSON.parse(window.localStorage.getItem('boardState'));
  expect(boardState.guesses).toEqual(['WHICH']);
  expect(boardState.solutionIndex).toBe(solutionIndex);
});
