import { fireEvent, render, screen } from '@testing-library/react';
import { solution } from 'lib/words';
import Keyboard from './Keyboard';

const setup = (guesses = []) => {
  const handlers = {
    onEnter: jest.fn(),
    onDelete: jest.fn(),
    onKeyDown: jest.fn(),
  };
  render(<Keyboard guesses={guesses} {...handlers} />);
  return handlers;
};

test('clicking keys enters letters, submits and deletes', () => {
  const { onEnter, onDelete, onKeyDown } = setup();

  fireEvent.click(screen.getByRole('button', { name: 'Q' }));
  fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
  fireEvent.click(screen.getByRole('button', { name: 'Backspace' }));

  expect(onKeyDown).toHaveBeenCalledWith('Q');
  expect(onEnter).toHaveBeenCalledTimes(1);
  expect(onDelete).toHaveBeenCalledTimes(1);
});

test('physical keyboard input is still supported', () => {
  const { onEnter, onDelete, onKeyDown } = setup();

  fireEvent.keyDown(window, { key: 'a' });
  fireEvent.keyDown(window, { key: 'Enter' });
  fireEvent.keyDown(window, { key: 'Backspace' });
  fireEvent.keyDown(window, { key: '1' });

  expect(onKeyDown).toHaveBeenCalledTimes(1);
  expect(onKeyDown).toHaveBeenCalledWith('A');
  expect(onEnter).toHaveBeenCalledTimes(1);
  expect(onDelete).toHaveBeenCalledTimes(1);
});

test('key states reflect previous guesses', () => {
  const word = solution.toUpperCase();
  const absent = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    .split('')
    .find(c => !word.includes(c));
  setup([word]);

  word.split('').forEach(c => {
    expect(screen.getByRole('button', { name: c })).toHaveAttribute(
      'data-state',
      'correct'
    );
  });
  expect(screen.getByRole('button', { name: absent })).toHaveAttribute(
    'data-state',
    'unused'
  );
});
