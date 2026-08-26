import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { AlertProvider } from 'context/AlertContext';
import { solution, solutionIndex } from 'lib/words';

const renderApp = () =>
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );

const openSettings = () => {
  const buttons = screen.getAllByRole('button');
  fireEvent.click(buttons[2]); // gear icon
};

const toggleUnlimitedMode = () => {
  openSettings();
  fireEvent.click(screen.getAllByRole('checkbox')[0]); // Unlimited Mode row
};

beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('renders the game in daily mode by default', () => {
  renderApp();
  expect(screen.getByText('WORDLE')).toBeInTheDocument();
  expect(screen.queryByText('Unlimited')).not.toBeInTheDocument();
});

test('switching to unlimited mode shows the header badge and persists', () => {
  renderApp();
  toggleUnlimitedMode();
  expect(screen.getByText('Unlimited')).toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem('gameMode'))).toBe('unlimited');
});

test('mode survives reload', () => {
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  renderApp();
  expect(screen.getByText('Unlimited')).toBeInTheDocument();
});

test('board state is isolated per mode', () => {
  window.localStorage.setItem(
    'boardState',
    JSON.stringify({ guesses: ['CRANE'], solutionIndex })
  );
  renderApp();
  expect(screen.getAllByText('C').length).toBeGreaterThan(1); // grid + keyboard

  toggleUnlimitedMode();
  const unlimitedBoard = JSON.parse(
    window.localStorage.getItem('unlimitedBoardState')
  );
  expect(unlimitedBoard.guesses).toEqual([]);

  const dailyBoard = JSON.parse(window.localStorage.getItem('boardState'));
  expect(dailyBoard.guesses).toEqual(['CRANE']);

  // switch back restores the daily board
  fireEvent.click(screen.getAllByRole('checkbox')[0]);
  expect(JSON.parse(window.localStorage.getItem('gameMode'))).toBe('daily');
});

test('unlimited games never touch daily gameStats', () => {
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  window.localStorage.setItem(
    'unlimitedBoardState',
    JSON.stringify({ guesses: [], solution: 'cigar' })
  );
  renderApp();

  'CIGAR'.split('').forEach(letter => {
    fireEvent.keyDown(window, { key: letter });
  });
  fireEvent.keyDown(window, { key: 'Enter' });

  expect(window.localStorage.getItem('gameStats')).toBeNull();
  const practiceStats = JSON.parse(
    window.localStorage.getItem('practiceStats')
  );
  expect(practiceStats.totalGames).toBe(1);
  expect(practiceStats.currentStreak).toBe(1);
});

test('daily games never touch practiceStats', () => {
  renderApp();

  solution
    .toUpperCase()
    .split('')
    .forEach(letter => {
      fireEvent.keyDown(window, { key: letter });
    });
  fireEvent.keyDown(window, { key: 'Enter' });

  expect(window.localStorage.getItem('practiceStats')).toBeNull();
  const stats = JSON.parse(window.localStorage.getItem('gameStats'));
  expect(stats.totalGames).toBe(1);
});
