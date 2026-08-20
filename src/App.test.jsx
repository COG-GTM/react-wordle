import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
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

test('restores unlimited mode from localStorage', () => {
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  renderApp();
  expect(screen.getByText('UNLIMITED')).toBeInTheDocument();
});

test('keeps board state separate per mode', () => {
  window.localStorage.setItem(
    'boardState',
    JSON.stringify({ guesses: ['CRANE'], solutionIndex: 0 })
  );
  window.localStorage.setItem(
    'unlimitedState',
    JSON.stringify({ guesses: [], solutionIndex: 3 })
  );
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  renderApp();

  const boardState = JSON.parse(window.localStorage.getItem('boardState'));
  expect(boardState.guesses).toEqual(['CRANE']);
});
