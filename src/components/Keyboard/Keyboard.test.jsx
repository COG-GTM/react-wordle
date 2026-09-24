import { render, screen, fireEvent } from '@testing-library/react';
import Keyboard from './Keyboard';
import { getStatuses } from 'lib/words';

// the real solution depends on the current date, so grading is stubbed out
jest.mock('lib/words', () => ({ getStatuses: jest.fn() }));

beforeEach(() => {
  getStatuses.mockReturnValue({});
});

const renderKeyboard = props => {
  const handlers = {
    onEnter: jest.fn(),
    onDelete: jest.fn(),
    onKeyDown: jest.fn(),
  };
  const view = render(<Keyboard guesses={[]} {...handlers} {...props} />);

  return { ...view, ...handlers };
};

it('renders every letter key plus the action keys', () => {
  renderKeyboard();

  expect(screen.getAllByRole('button')).toHaveLength(28);
  expect(screen.getByText('ENTER')).toHaveClass('action');
  expect(screen.getByText('DELETE')).toHaveClass('action');
});

it('reports a clicked letter', () => {
  const { onKeyDown } = renderKeyboard();

  fireEvent.click(screen.getByText('Q'));

  expect(onKeyDown).toHaveBeenCalledWith('Q');
});

it('reports clicks on the action keys', () => {
  const { onEnter, onDelete, onKeyDown } = renderKeyboard();

  fireEvent.click(screen.getByText('ENTER'));
  fireEvent.click(screen.getByText('DELETE'));

  expect(onEnter).toHaveBeenCalledTimes(1);
  expect(onDelete).toHaveBeenCalledTimes(1);
  expect(onKeyDown).not.toHaveBeenCalled();
});

it('handles physical keyboard input', () => {
  const { onEnter, onDelete, onKeyDown } = renderKeyboard();

  fireEvent.keyDown(window, { key: 'a' });
  fireEvent.keyDown(window, { key: 'Enter' });
  fireEvent.keyDown(window, { key: 'Backspace' });

  expect(onKeyDown).toHaveBeenCalledWith('A');
  expect(onEnter).toHaveBeenCalledTimes(1);
  expect(onDelete).toHaveBeenCalledTimes(1);
});

it('ignores non-letter keys', () => {
  const { onKeyDown } = renderKeyboard();

  fireEvent.keyDown(window, { key: '1' });
  fireEvent.keyDown(window, { key: 'Shift' });

  expect(onKeyDown).not.toHaveBeenCalled();
});

it('stops listening to key events after unmount', () => {
  const { unmount, onKeyDown } = renderKeyboard();

  unmount();
  fireEvent.keyDown(window, { key: 'a' });

  expect(onKeyDown).not.toHaveBeenCalled();
});

it('colors keys according to the statuses of previous guesses', () => {
  getStatuses.mockReturnValue({ R: 'correct', E: 'present', Q: 'absent' });

  renderKeyboard({ guesses: ['REACT'] });

  expect(getStatuses).toHaveBeenCalledWith(['REACT']);
  expect(screen.getByText('R')).toHaveClass('correct');
  expect(screen.getByText('E')).toHaveClass('present');
  expect(screen.getByText('Q')).toHaveClass('absent');
  expect(screen.getByText('Z')).toHaveClass('key');
});
