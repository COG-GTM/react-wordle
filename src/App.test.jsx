import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';
import { AlertProvider } from 'context/AlertContext';

const SOLUTION = 'react';
const SOLUTION_INDEX = 100;

// the real solution rotates daily, so it is pinned for the whole suite
jest.mock('lib/words', () => ({
  ...jest.requireActual('lib/words'),
  solution: 'react',
  solutionIndex: 100,
}));

const renderApp = () =>
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );

const type = word => {
  word.split('').forEach(letter => fireEvent.keyDown(window, { key: letter }));
};

const submit = word => {
  type(word);
  fireEvent.keyDown(window, { key: 'Enter' });
};

const boardState = () => JSON.parse(window.localStorage.getItem('boardState'));

beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

it('renders the board, the keyboard and the header', () => {
  const { container } = renderApp();

  expect(screen.getByRole('heading', { name: 'WORDLE' })).toBeInTheDocument();
  expect(container.querySelectorAll('.cell')).toHaveLength(30);
  expect(screen.getByText('ENTER')).toBeInTheDocument();
});

it('welcomes a first time player with the info modal', () => {
  renderApp();

  expect(screen.queryByText('How to play')).not.toBeInTheDocument();
  act(() => jest.advanceTimersByTime(1000));

  expect(screen.getByText('How to play')).toBeInTheDocument();
});

it('shows typed letters and removes them again on delete', () => {
  const { container } = renderApp();

  type('RE');
  expect(container.querySelectorAll('.fill')).toHaveLength(2);

  fireEvent.keyDown(window, { key: 'Backspace' });
  expect(container.querySelectorAll('.fill')).toHaveLength(1);
});

it('refuses to accept a guess shorter than five letters', () => {
  renderApp();

  submit('REA');

  expect(screen.getByText('Not enough letters')).toBeInTheDocument();
  expect(boardState().guesses).toEqual([]);
});

it('refuses a word that is not in the word list', () => {
  renderApp();

  submit('ZZZZZ');

  expect(screen.getByText('Not in word list')).toBeInTheDocument();
  expect(boardState().guesses).toEqual([]);
});

it('accepts a valid guess and persists it', () => {
  renderApp();

  submit('TRADE');

  expect(boardState()).toEqual({
    guesses: ['TRADE'],
    solutionIndex: SOLUTION_INDEX,
  });
});

it('congratulates the player on a win and records the stats', () => {
  renderApp();

  submit(SOLUTION.toUpperCase());
  act(() => jest.advanceTimersByTime(2000));

  expect(screen.getByText('Well done')).toBeInTheDocument();
  const stats = JSON.parse(window.localStorage.getItem('gameStats'));
  expect(stats).toMatchObject({ totalGames: 1, currentStreak: 1 });
  expect(stats.winDistribution[0]).toBe(1);
});

it('ignores further input once the game is won', () => {
  const { container } = renderApp();

  submit(SOLUTION.toUpperCase());
  type('T');

  expect(container.querySelectorAll('.fill')).toHaveLength(5);
});

it('reveals the solution after six failed guesses', () => {
  renderApp();

  for (let i = 0; i < 6; i++) submit('TRADE');
  act(() => jest.advanceTimersByTime(2000));

  expect(screen.getByText(`The word was ${SOLUTION}`)).toBeInTheDocument();
  const stats = JSON.parse(window.localStorage.getItem('gameStats'));
  expect(stats).toMatchObject({ gamesFailed: 1, currentStreak: 0 });
});

it('restores the guesses of an unfinished game for the same day', () => {
  window.localStorage.setItem(
    'boardState',
    JSON.stringify({ guesses: ['TRADE'], solutionIndex: SOLUTION_INDEX })
  );

  const { container } = renderApp();

  expect(container.querySelectorAll('.reveal')).toHaveLength(5);
});

it('discards a board state from a previous day', () => {
  window.localStorage.setItem(
    'boardState',
    JSON.stringify({ guesses: ['TRADE'], solutionIndex: SOLUTION_INDEX - 1 })
  );

  const { container } = renderApp();

  expect(container.querySelectorAll('.reveal')).toHaveLength(0);
});

it('enforces revealed hints in hard mode', () => {
  window.localStorage.setItem('hard-mode', 'true');
  renderApp();

  submit('TRADE');
  submit('PLONK');

  expect(screen.getByText(/Must use|Guess must contain/)).toBeInTheDocument();
  expect(boardState().guesses).toEqual(['TRADE']);
});

it('toggles and persists the settings from the settings modal', () => {
  renderApp();
  const [, , settings] = screen.getAllByRole('button');

  fireEvent.click(settings);
  const [hardMode, darkMode, highContrast] = screen.getAllByRole('checkbox');
  fireEvent.click(hardMode);
  fireEvent.click(darkMode);
  fireEvent.click(highContrast);

  expect(window.localStorage.getItem('hard-mode')).toBe('true');
  expect(window.localStorage.getItem('theme')).toBe('"light"');
  expect(window.localStorage.getItem('high-contrast')).toBe('true');
  expect(document.body).not.toHaveAttribute('data-theme');
  expect(document.body).toHaveAttribute('data-mode', 'high-contrast');
});

it('closes a modal again from its close button', () => {
  const { container } = renderApp();
  const [info] = screen.getAllByRole('button');

  fireEvent.click(info);
  expect(screen.getByText('How to play')).toBeInTheDocument();

  fireEvent.click(container.querySelector('.close'));
  act(() => jest.advanceTimersByTime(300));
  expect(screen.queryByText('How to play')).not.toBeInTheDocument();
});

it('opens and closes the statistics modal from the header', () => {
  const { container } = renderApp();
  const [, stats] = screen.getAllByRole('button');

  fireEvent.click(stats);
  expect(screen.getByText('Statistics')).toBeInTheDocument();
  expect(screen.getByText('Guess Distribution')).toBeInTheDocument();

  fireEvent.click(container.querySelector('.close'));
  act(() => jest.advanceTimersByTime(300));
  expect(screen.queryByText('Statistics')).not.toBeInTheDocument();
});

it('applies the stored theme and high contrast settings to the body', () => {
  window.localStorage.setItem('theme', '"light"');
  window.localStorage.setItem('high-contrast', 'true');

  renderApp();

  expect(document.body).not.toHaveAttribute('data-theme');
  expect(document.body).toHaveAttribute('data-mode', 'high-contrast');
});
