import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import { solution, solutionIndex } from 'lib/words';
import App from './App';

const renderGame = () =>
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );

const submitGuess = word => {
  word.split('').forEach(key => fireEvent.keyDown(window, { key }));
  fireEvent.keyDown(window, { key: 'Enter' });
};

const advance = milliseconds => {
  act(() => jest.advanceTimersByTime(milliseconds));
};

beforeEach(() => {
  jest.useFakeTimers('modern');
  localStorage.clear();
  localStorage.setItem(
    'boardState',
    JSON.stringify({ guesses: [], solutionIndex })
  );
});

afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('shows a running daily timer but no solve time before completion', () => {
  renderGame();
  expect(screen.getByRole('timer', { name: 'Elapsed time' })).toHaveTextContent(
    '00:00'
  );
  advance(2000);
  expect(screen.getByRole('timer')).toHaveTextContent('00:02');
  expect(screen.queryByText('Solve time')).not.toBeInTheDocument();
});

test('freezes the winning solve time in the header and statistics across reloads', () => {
  const view = renderGame();
  advance(5200);
  submitGuess(solution.toUpperCase());
  const saved = JSON.parse(localStorage.getItem('gameTimer'));
  expect(saved.endedAt - saved.startedAt).toBe(5200);

  advance(4000);
  expect(screen.getByRole('timer')).toHaveTextContent('00:05');
  expect(screen.getByRole('region', { name: 'Solve time' })).toHaveTextContent(
    '00:05'
  );

  view.unmount();
  advance(10000);
  renderGame();
  advance(4000);
  expect(screen.getByRole('timer')).toHaveTextContent('00:05');
  expect(screen.getByRole('region', { name: 'Solve time' })).toHaveTextContent(
    '00:05'
  );
  expect(JSON.parse(localStorage.getItem('gameTimer'))).toEqual(saved);
});

test('freezes time after a loss and shows time played instead of solve time', () => {
  renderGame();
  advance(7200);
  const wrongWord = solution === 'crane' ? 'SLATE' : 'CRANE';
  for (let i = 0; i < 6; i++) submitGuess(wrongWord);

  advance(4000);
  expect(screen.getByRole('timer')).toHaveTextContent('00:07');
  expect(screen.getByRole('region', { name: 'Time played' })).toHaveTextContent(
    '00:07'
  );
  expect(screen.queryByText('Solve time')).not.toBeInTheDocument();
});

test('does not fabricate a solve time for an older completed board', () => {
  localStorage.setItem(
    'boardState',
    JSON.stringify({ guesses: [solution.toUpperCase()], solutionIndex })
  );
  renderGame();
  advance(4000);
  expect(screen.getByRole('timer')).toHaveTextContent('—');
  expect(screen.getByText('Not recorded')).toBeInTheDocument();
});
