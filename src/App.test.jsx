import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import { solution, solutionIndex } from 'lib/words';
import { WORDS } from 'constants/wordList';
import App from './App';

const answer = solution.toUpperCase();
const hintText = index =>
  `Hint: ${answer[index]} in position ${index + 1} · 1 of 1 used`;

const renderGame = () =>
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );

const saveBoard = board =>
  localStorage.setItem(
    'boardState',
    JSON.stringify({ guesses: [], solutionIndex, ...board })
  );

const submitWord = word => {
  word.split('').forEach(key => fireEvent.keyDown(window, { key }));
  fireEvent.click(screen.getByRole('button', { name: 'ENTER' }));
};

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  saveBoard();
});

afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('reveals one correct letter and position, without using a guess', () => {
  renderGame();
  fireEvent.click(screen.getByRole('button', { name: 'Reveal a hint' }));

  expect(screen.getByText(hintText(0))).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Hint used' })).toBeDisabled();
  expect(JSON.parse(localStorage.getItem('boardState'))).toEqual({
    guesses: [],
    solutionIndex,
    hintIndex: 0,
  });
  expect(localStorage.getItem('gameStats')).toBeNull();
});

test('keeps the hint and disabled button after reloading the same game', () => {
  const { unmount } = renderGame();
  fireEvent.click(screen.getByRole('button', { name: 'Reveal a hint' }));
  unmount();
  renderGame();

  fireEvent.click(screen.getByRole('button', { name: 'Hint used' }));
  expect(screen.getByText(hintText(0))).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Hint used' })).toBeDisabled();
});

test('chooses a position not already correctly revealed by a guess', () => {
  const guess = WORDS.find(
    word => word !== solution && word[0] === solution[0]
  ).toUpperCase();
  saveBoard({ guesses: [guess] });
  renderGame();
  fireEvent.click(screen.getByRole('button', { name: 'Reveal a hint' }));

  const index = answer.split('').findIndex((letter, i) => guess[i] !== letter);
  expect(screen.getByText(hintText(index))).toBeInTheDocument();
});

test('starts a new daily game with an unused hint', () => {
  saveBoard({ solutionIndex: solutionIndex - 1, hintIndex: 2 });
  renderGame();

  expect(screen.getByRole('button', { name: 'Reveal a hint' })).toBeEnabled();
  expect(screen.queryByText(/1 of 1 used/)).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('boardState')).hintIndex).toBeNull();
});

test.each([
  ['won', [answer]],
  ['lost', Array(6).fill(answer === 'ADIEU' ? 'STARE' : 'ADIEU')],
])('does not offer a hint after a %s game', (_, guesses) => {
  saveBoard({ guesses });
  renderGame();
  expect(screen.getByRole('button', { name: 'Reveal a hint' })).toBeDisabled();
});

test('marks an in-progress game as hinted in Statistics', () => {
  renderGame();
  fireEvent.click(screen.getByRole('button', { name: 'Reveal a hint' }));
  fireEvent.click(screen.getByRole('button', { name: 'Statistics' }));
  expect(screen.getByText('This game: Hinted')).toBeInTheDocument();
});

test('marks a completed hinted game and preserves its label after reload', () => {
  renderGame();
  fireEvent.click(screen.getByRole('button', { name: 'Reveal a hint' }));
  submitWord(answer);
  fireEvent.click(screen.getByRole('button', { name: 'Statistics' }));

  expect(screen.getByText('This game: Hinted')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('gameStats')).totalGames).toBe(1);
  cleanup();
  renderGame();
  fireEvent.click(screen.getByRole('button', { name: 'Statistics' }));
  expect(screen.getByText('This game: Hinted')).toBeInTheDocument();
});

test('does not mark an unhinted game in Statistics', () => {
  renderGame();
  fireEvent.click(screen.getByRole('button', { name: 'Statistics' }));
  expect(screen.queryByText('This game: Hinted')).not.toBeInTheDocument();
});

test('keeps the hinted letter in its position in hard mode', () => {
  localStorage.setItem('hard-mode', 'true');
  renderGame();
  fireEvent.click(screen.getByRole('button', { name: 'Reveal a hint' }));
  submitWord(WORDS.find(word => word[0] !== solution[0]).toUpperCase());

  expect(
    screen.getByText(`Must use ${answer[0]} in position 1`)
  ).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('boardState')).guesses).toEqual([]);
});

test('leaves a partially typed guess unchanged when revealing a hint', () => {
  renderGame();
  fireEvent.click(screen.getByRole('button', { name: 'Q' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reveal a hint' }));

  expect(screen.getAllByText('Q')).toHaveLength(2);
  expect(screen.getByText(hintText(0))).toBeInTheDocument();
});
