import { render, screen, fireEvent, act } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import { getRandomWord, getWordOfDay } from 'lib/words';
import App from './App';

const PRACTICE_WORDS = ['crane', 'pilot'];

jest.mock('lib/words', () => ({
  ...jest.requireActual('lib/words'),
  getRandomWord: jest.fn(),
}));

const renderApp = () => render(<App />, { wrapper: AlertProvider });

const typeGuess = word => {
  word
    .toUpperCase()
    .split('')
    .forEach(letter => fireEvent.keyDown(window, { key: letter }));
  fireEvent.keyDown(window, { key: 'Enter' });
};

const openSettings = () => {
  fireEvent.click(document.querySelectorAll('header button')[2]);
};

const toggleUnlimitedMode = () => {
  openSettings();
  fireEvent.click(screen.getAllByRole('checkbox')[0]);
};

const completedRows = () =>
  Array.from(document.querySelector('[class*="grid"]').children)
    .map(row => row.textContent)
    .filter(text => text.length === 5);

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  getRandomWord.mockReset();
  PRACTICE_WORDS.forEach(solution =>
    getRandomWord.mockReturnValueOnce({ solution })
  );
});

afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

test('plays the daily word by default', () => {
  renderApp();

  typeGuess('crane');

  expect(JSON.parse(localStorage.getItem('boardState'))).toEqual({
    guesses: ['CRANE'],
    solutionIndex: getWordOfDay().solutionIndex,
  });
});

test('keeps the in-progress daily board when switching modes', () => {
  renderApp();
  typeGuess('crane');

  toggleUnlimitedMode();

  expect(localStorage.getItem('gameMode')).toBe('"unlimited"');
  expect(completedRows()).toEqual([]);

  typeGuess('pilot');
  expect(JSON.parse(localStorage.getItem('unlimitedBoardState'))).toEqual({
    guesses: ['PILOT'],
    solution: PRACTICE_WORDS[0],
  });
  expect(JSON.parse(localStorage.getItem('boardState')).guesses).toEqual([
    'CRANE',
  ]);

  toggleUnlimitedMode();

  expect(localStorage.getItem('gameMode')).toBe('"daily"');
  expect(completedRows()).toEqual(['CRANE']);
});

test('practice games leave the daily stats untouched', () => {
  renderApp();
  toggleUnlimitedMode();

  typeGuess(PRACTICE_WORDS[0]);

  expect(JSON.parse(localStorage.getItem('practiceStats'))).toMatchObject({
    totalGames: 1,
    currentStreak: 1,
    successRate: 100,
  });
  expect(localStorage.getItem('gameStats')).toBeNull();
});

test('starts a fresh practice game with a new word', () => {
  renderApp();
  toggleUnlimitedMode();

  typeGuess(PRACTICE_WORDS[0]);
  act(() => jest.runOnlyPendingTimers());

  expect(screen.queryByText('Next word in')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('New Game'));

  expect(completedRows()).toEqual([]);
  expect(JSON.parse(localStorage.getItem('unlimitedBoardState'))).toEqual({
    guesses: [],
    solution: PRACTICE_WORDS[1],
  });
});
