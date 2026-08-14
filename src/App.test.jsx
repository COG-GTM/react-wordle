import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import { solutionIndex } from 'lib/words';
import App from './App';

const renderApp = () =>
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );

beforeEach(() => {
  window.localStorage.clear();
});

test('renders the daily game by default', () => {
  renderApp();
  expect(screen.getByText('WORDLE')).toBeInTheDocument();
  expect(screen.queryByText('UNLIMITED')).not.toBeInTheDocument();
});

test('shows the unlimited badge when gameMode is unlimited', () => {
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  renderApp();
  expect(screen.getByText('UNLIMITED')).toBeInTheDocument();
});

test('unlimited mode does not overwrite the daily board state', () => {
  const dailyBoard = { guesses: ['CIGAR'], solutionIndex };
  window.localStorage.setItem('boardState', JSON.stringify(dailyBoard));
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  window.localStorage.setItem(
    'boardStateUnlimited',
    JSON.stringify({ guesses: [], solution: 'rebut' })
  );

  renderApp();

  expect(JSON.parse(window.localStorage.getItem('boardState'))).toEqual(
    dailyBoard
  );
});

test('unlimited mode restores its own board from localStorage', () => {
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  window.localStorage.setItem(
    'boardStateUnlimited',
    JSON.stringify({ guesses: ['CIGAR'], solution: 'rebut' })
  );

  renderApp();

  const stored = JSON.parse(window.localStorage.getItem('boardStateUnlimited'));
  expect(stored.guesses).toEqual(['CIGAR']);
  expect(stored.solution).toBe('rebut');
});
