import { fireEvent, render, screen, act } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import { solutionIndex } from 'lib/words';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test.each(['apple', 'brick'])(
  'practice ending with %s leaves daily data intact',
  word => {
    const daily = { guesses: ['CRANE'], solutionIndex };
    localStorage.setItem('boardState', JSON.stringify(daily));
    localStorage.setItem(
      'practiceBoardState',
      JSON.stringify({ solution: 'apple', guesses: [] })
    );
    const { container } = render(
      <AlertProvider>
        <App />
      </AlertProvider>
    );
    const statsBefore = localStorage.getItem('gameStats');
    fireEvent.keyDown(window, { key: 'S' });
    const toggle = () => {
      fireEvent.click(container.querySelectorAll('header button')[2]);
      fireEvent.click(screen.getAllByRole('checkbox')[0]);
      fireEvent.click(
        screen.getByText('Setting').parentElement.querySelector('button')
      );
      act(() => jest.advanceTimersByTime(300));
    };
    toggle();
    expect(screen.getByText('Practice')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByText('Not enough letters')).toBeInTheDocument();
    const attempts = word === 'apple' ? 1 : 6;
    for (let i = 0; i < attempts; i++) {
      for (const key of word) fireEvent.keyDown(window, { key });
      fireEvent.keyDown(window, { key: 'Enter' });
    }
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.getByText('Play again')).toBeInTheDocument();
    expect(localStorage.getItem('boardState')).toBe(JSON.stringify(daily));
    expect(localStorage.getItem('gameStats')).toBe(statsBefore);
    fireEvent.click(screen.getByText('Play again'));
    expect(
      JSON.parse(localStorage.getItem('practiceBoardState')).guesses
    ).toEqual([]);
    act(() => jest.advanceTimersByTime(300));
    toggle();
    expect(screen.queryByText('Practice')).not.toBeInTheDocument();
    expect(localStorage.getItem('boardState')).toBe(JSON.stringify(daily));
    expect(container.querySelectorAll('header button')).toHaveLength(3);
  }
);
