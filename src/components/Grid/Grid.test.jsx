import { render, screen } from '@testing-library/react';
import Grid from './Grid';
import { solution } from 'lib/words';
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

test('renders a full empty board', () => {
  renderGrid();
  expect(screen.getAllByTestId('cell')).toHaveLength(
    MAX_CHALLENGES * MAX_WORD_LENGTH
  );
});

test('typed letters get the fill (pop) class', () => {
  renderGrid({ currentGuess: 'AB' });
  const filled = screen
    .getAllByTestId('cell')
    .filter(cell => cell.classList.contains('fill'));
  expect(filled.map(cell => cell.textContent)).toEqual(['A', 'B']);
});

test('completed rows reveal with a left-to-right stagger', () => {
  renderGrid({ guesses: ['CRANE'] });
  const row = screen.getAllByTestId('cell').slice(0, MAX_WORD_LENGTH);
  row.forEach((cell, i) => {
    expect(cell).toHaveClass('reveal');
    expect(cell.dataset.status).toMatch(/correct|present|absent/);
    expect(cell.style.getPropertyValue('--reveal-delay')).toBe(`${i * 300}ms`);
  });
});

test('only the winning row bounces', () => {
  const win = solution.toUpperCase();
  const other = win === 'CRANE' ? 'PILOT' : 'CRANE';
  renderGrid({ guesses: [other, win] });
  const cells = screen.getAllByTestId('cell');
  expect(cells.slice(0, 5).some(c => c.classList.contains('bounce'))).toBe(
    false
  );
  cells
    .slice(5, 10)
    .forEach(cell => expect(cell).toHaveClass('bounce', 'correct'));
});

test('invalid guess jiggles the current row', () => {
  const { container } = renderGrid({ currentGuess: 'XXXXX', isJiggling: true });
  expect(container.querySelector('.jiggle')).not.toBeNull();
});
