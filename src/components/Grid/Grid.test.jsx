import { render, screen, act } from '@testing-library/react';
import Grid from './Grid';
import { MAX_CHALLENGES, MAX_WORD_LENGTH } from 'constants/settings';

const renderGrid = props =>
  render(
    <Grid
      currentGuess=""
      guesses={[]}
      isJiggling={false}
      setIsJiggling={() => {}}
      {...props}
    />
  );

const rows = container => container.firstChild.children;

it('renders one row per allowed guess', () => {
  const { container } = renderGrid();

  expect(rows(container)).toHaveLength(MAX_CHALLENGES);
  expect(container.querySelectorAll('.cell')).toHaveLength(
    MAX_CHALLENGES * MAX_WORD_LENGTH
  );
});

it('renders the current guess and pads the row with empty cells', () => {
  const { container } = renderGrid({ currentGuess: 'RE' });

  expect(screen.getByText('R')).toBeInTheDocument();
  expect(screen.getByText('E')).toBeInTheDocument();
  expect(container.querySelectorAll('.fill')).toHaveLength(2);
});

it('reveals statuses for completed guesses', () => {
  const { container } = renderGrid({ guesses: ['REACT'] });

  expect(container.querySelectorAll('.reveal')).toHaveLength(MAX_WORD_LENGTH);
  expect(rows(container)).toHaveLength(MAX_CHALLENGES);
});

it('drops the current row once every guess is used', () => {
  const guesses = Array(MAX_CHALLENGES).fill('REACT');

  const { container } = renderGrid({ guesses });

  expect(rows(container)).toHaveLength(MAX_CHALLENGES);
  expect(container.querySelectorAll('.reveal')).toHaveLength(
    MAX_CHALLENGES * MAX_WORD_LENGTH
  );
});

it('jiggles the current row and resets the flag afterwards', () => {
  jest.useFakeTimers();
  const setIsJiggling = jest.fn();

  const { container } = renderGrid({ isJiggling: true, setIsJiggling });
  expect(container.querySelector('.jiggle')).toBeInTheDocument();

  act(() => jest.advanceTimersByTime(500));
  expect(setIsJiggling).toHaveBeenCalledWith(false);

  jest.useRealTimers();
});
