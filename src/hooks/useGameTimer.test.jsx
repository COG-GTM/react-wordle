import { act, cleanup, render, screen } from '@testing-library/react';
import useGameTimer from './useGameTimer';

const Timer = ({ index = 123, complete = false }) => {
  const elapsed = useGameTimer(index, complete);
  return <output data-testid="elapsed">{elapsed ?? 'unrecorded'}</output>;
};

const advance = milliseconds => {
  act(() => jest.advanceTimersByTime(milliseconds));
};

beforeEach(() => {
  jest.useFakeTimers('modern');
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('resumes elapsed wall time after a reload, including time away', () => {
  const startedAt = Date.now();
  const view = render(<Timer />);
  advance(2500);
  expect(screen.getByTestId('elapsed')).toHaveTextContent('2000');
  view.unmount();
  advance(7000);

  render(<Timer />);
  expect(screen.getByTestId('elapsed')).toHaveTextContent('9500');
  expect(JSON.parse(localStorage.getItem('gameTimer'))).toEqual({
    solutionIndex: 123,
    startedAt,
    endedAt: null,
  });
});

test('stops at completion, clears the interval, and restores the same end time', () => {
  const view = render(<Timer />);
  advance(5200);
  view.rerender(<Timer complete />);
  expect(screen.getByTestId('elapsed')).toHaveTextContent('5200');
  expect(jest.getTimerCount()).toBe(0);

  view.unmount();
  advance(10000);
  render(<Timer complete />);
  expect(screen.getByTestId('elapsed')).toHaveTextContent('5200');
});

test('starts a new timer for a different daily puzzle', () => {
  const view = render(<Timer />);
  advance(10000);
  view.unmount();

  render(<Timer index={124} />);
  expect(screen.getByTestId('elapsed')).toHaveTextContent('0');
  expect(JSON.parse(localStorage.getItem('gameTimer')).solutionIndex).toBe(124);
});

test.each(['broken json', 'null', '{"solutionIndex":123,"startedAt":"bad"}'])(
  'recovers from invalid saved timer: %s',
  saved => {
    localStorage.setItem('gameTimer', saved);
    render(<Timer />);
    advance(1000);
    expect(screen.getByTestId('elapsed')).toHaveTextContent('1000');
  }
);

test('continues in memory when browser storage is unavailable', () => {
  const unavailable = () => {
    throw new Error('Storage disabled');
  };
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(unavailable);
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(unavailable);
  const view = render(<Timer />);
  advance(3000);
  expect(screen.getByTestId('elapsed')).toHaveTextContent('3000');
  view.rerender(<Timer complete />);
  advance(2000);
  expect(screen.getByTestId('elapsed')).toHaveTextContent('3000');
});
