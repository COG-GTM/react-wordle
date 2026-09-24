import { render, screen } from '@testing-library/react';
import Cell from './Cell';

it('renders an empty cell without a value', () => {
  const { container } = render(<Cell />);

  expect(container.firstChild).toHaveClass('cell');
  expect(container.firstChild).not.toHaveClass('fill');
});

it('marks a cell holding a letter as filled', () => {
  const { container } = render(<Cell value="R" />);

  expect(screen.getByText('R')).toBeInTheDocument();
  expect(container.firstChild).toHaveClass('fill');
});

it.each(['absent', 'present', 'correct'])(
  'applies the %s status class on a completed cell',
  status => {
    const { container } = render(
      <Cell value="R" status={status} isCompleted />
    );

    expect(container.firstChild).toHaveClass(status, 'reveal');
  }
);

it('staggers the reveal animation by position', () => {
  const { container } = render(<Cell value="R" position={2} isCompleted />);

  expect(container.firstChild).toHaveStyle('animation-delay: 0.7s');
});
