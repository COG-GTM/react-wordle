import { render, screen } from '@testing-library/react';
import App from './App';
import { AlertProvider } from 'context/AlertContext';
import { solutionIndex } from 'lib/words';

const renderApp = () =>
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );

beforeEach(() => {
  window.localStorage.clear();
});

test('renders the game in daily mode by default', () => {
  renderApp();
  expect(screen.getByText('WORDLE')).toBeInTheDocument();
  expect(screen.queryByText('UNLIMITED')).not.toBeInTheDocument();
});

test('starts in unlimited mode when gameMode is persisted', () => {
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  renderApp();
  expect(screen.getByText('UNLIMITED')).toBeInTheDocument();
});

test('daily board state is preserved while playing unlimited mode', () => {
  const dailyBoard = { guesses: ['CIGAR'], solutionIndex };
  window.localStorage.setItem('boardState', JSON.stringify(dailyBoard));
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  renderApp();
  expect(JSON.parse(window.localStorage.getItem('boardState'))).toEqual(
    dailyBoard
  );
});

test('unlimited mode stores its board separately from daily', () => {
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  renderApp();
  const unlimitedBoard = JSON.parse(
    window.localStorage.getItem('unlimitedBoardState')
  );
  expect(unlimitedBoard.solution).toBeTruthy();
  expect(unlimitedBoard.guesses).toEqual([]);
});

test('daily gameStats are untouched by unlimited play state', () => {
  const stats = {
    winDistribution: [0, 1, 0, 0, 0, 0],
    gamesFailed: 0,
    currentStreak: 1,
    bestStreak: 1,
    totalGames: 1,
    successRate: 100,
  };
  window.localStorage.setItem('gameStats', JSON.stringify(stats));
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  renderApp();
  expect(JSON.parse(window.localStorage.getItem('gameStats'))).toEqual(stats);
});
