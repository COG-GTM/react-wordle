import { render, screen } from '@testing-library/react';
import Cell from './Cell';

describe('Cell', () => {
  test('renders the letter value passed as prop', () => {
    render(<Cell value="A" position={0} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  test('applies absent class when status="absent"', () => {
    const { container } = render(
      <Cell value="A" status="absent" position={0} />
    );
    expect(container.firstChild.className).toContain('absent');
  });

  test('applies present class when status="present"', () => {
    const { container } = render(
      <Cell value="A" status="present" position={0} />
    );
    expect(container.firstChild.className).toContain('present');
  });

  test('applies correct class when status="correct"', () => {
    const { container } = render(
      <Cell value="A" status="correct" position={0} />
    );
    expect(container.firstChild.className).toContain('correct');
  });

  test('applies fill class when value is truthy', () => {
    const { container } = render(<Cell value="A" position={0} />);
    expect(container.firstChild.className).toContain('fill');
  });

  test('does not apply fill class when value is falsy', () => {
    const { container } = render(<Cell value="" position={0} />);
    expect(container.firstChild.className).not.toContain('fill');
  });

  test('applies reveal class when isCompleted is true', () => {
    const { container } = render(
      <Cell value="A" position={0} isCompleted={true} />
    );
    expect(container.firstChild.className).toContain('reveal');
  });

  test('sets animation delay based on position prop', () => {
    const { container } = render(<Cell value="A" position={2} />);
    expect(container.firstChild.style.animationDelay).toBe('0.7s');
  });
});
