import { render, screen, fireEvent } from '@testing-library/react';
import useLocalStorage from './useLocalStorage';

const Consumer = ({ storageKey, initialValue, nextValue }) => {
  const [value, setValue] = useLocalStorage(storageKey, initialValue);

  return (
    <>
      <span data-testid="value">{JSON.stringify(value)}</span>
      <button onClick={() => setValue(nextValue)}>set</button>
      <button onClick={() => setValue(previous => [...previous, 'added'])}>
        append
      </button>
    </>
  );
};

const value = () => screen.getByTestId('value').textContent;

beforeEach(() => {
  window.localStorage.clear();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('returns the initial value when nothing is stored', () => {
  render(<Consumer storageKey="theme" initialValue="dark" />);

  expect(value()).toBe('"dark"');
});

it('reads an existing value from localStorage', () => {
  window.localStorage.setItem('theme', JSON.stringify('light'));

  render(<Consumer storageKey="theme" initialValue="dark" />);

  expect(value()).toBe('"light"');
});

it('falls back to the initial value when the stored json is corrupt', () => {
  window.localStorage.setItem('theme', '{not json');

  render(<Consumer storageKey="theme" initialValue="dark" />);

  expect(value()).toBe('"dark"');
});

it('persists a new value to localStorage', () => {
  render(<Consumer storageKey="theme" initialValue="dark" nextValue="light" />);

  fireEvent.click(screen.getByText('set'));

  expect(value()).toBe('"light"');
  expect(window.localStorage.getItem('theme')).toBe('"light"');
});

it('keeps the value in state when localStorage rejects the write', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota exceeded');
  });
  render(<Consumer storageKey="theme" initialValue="dark" nextValue="light" />);

  fireEvent.click(screen.getByText('set'));

  expect(value()).toBe('"light"');
});

it('supports an updater function like useState', () => {
  render(<Consumer storageKey="guesses" initialValue={['REACT']} />);

  fireEvent.click(screen.getByText('append'));

  expect(window.localStorage.getItem('guesses')).toBe('["REACT","added"]');
});
