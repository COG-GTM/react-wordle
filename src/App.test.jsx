import { render, screen, fireEvent, act } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

// Helper to render App with required providers
const renderApp = () => {
  return render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
};

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

describe('Word Length Feature', () => {
  describe('Grid renders correct number of cells per row', () => {
    test('default word length of 5 renders 5 cells per row', () => {
      renderApp();
      const cells = document.querySelectorAll('[class*="cell"]');
      // 6 rows * 5 cells = 30 cells
      expect(cells.length).toBe(30);
    });

    test('word length of 4 renders 4 cells per row', () => {
      localStorage.setItem('word-length', JSON.stringify(4));
      renderApp();
      const cells = document.querySelectorAll('[class*="cell"]');
      // 6 rows * 4 cells = 24 cells
      expect(cells.length).toBe(24);
    });

    test('word length of 6 renders 6 cells per row', () => {
      localStorage.setItem('word-length', JSON.stringify(6));
      renderApp();
      const cells = document.querySelectorAll('[class*="cell"]');
      // 6 rows * 6 cells = 36 cells
      expect(cells.length).toBe(36);
    });
  });

  describe('Changing word length via settings', () => {
    test('selecting word length 4 updates the grid to 4 cells per row', () => {
      renderApp();

      // Initially 5 cells per row = 30 cells
      let cells = document.querySelectorAll('[class*="cell"]');
      expect(cells.length).toBe(30);

      // Find and click the settings icon button (gear icon in header)
      const headerButtons = document.querySelectorAll(
        'header button, [class*="header"] button, [class*="Header"] button'
      );
      const settingsBtn =
        headerButtons.length > 0
          ? headerButtons[headerButtons.length - 1]
          : document.querySelectorAll('button')[2];

      act(() => {
        fireEvent.click(settingsBtn);
      });

      // Click word length 4 button
      const wordLength4Button = screen.getByTestId('word-length-4');
      act(() => {
        fireEvent.click(wordLength4Button);
      });

      // Now grid should have 4 cells per row = 24 cells
      cells = document.querySelectorAll('[class*="cell"]');
      expect(cells.length).toBe(24);
    });

    test('selecting word length 6 updates the grid to 6 cells per row', () => {
      renderApp();

      // Open settings
      const headerButtons = document.querySelectorAll(
        'header button, [class*="header"] button, [class*="Header"] button'
      );
      const settingsBtn =
        headerButtons.length > 0
          ? headerButtons[headerButtons.length - 1]
          : document.querySelectorAll('button')[2];

      act(() => {
        fireEvent.click(settingsBtn);
      });

      // Click word length 6 button
      const wordLength6Button = screen.getByTestId('word-length-6');
      act(() => {
        fireEvent.click(wordLength6Button);
      });

      // Now grid should have 6 cells per row = 36 cells
      const cells = document.querySelectorAll('[class*="cell"]');
      expect(cells.length).toBe(36);
    });
  });

  describe('Board resets when word length changes', () => {
    test('changing word length clears all guesses', () => {
      localStorage.setItem(
        'boardState',
        JSON.stringify({
          guesses: ['HELLO'],
          solutionIndex: '',
        })
      );
      localStorage.setItem('word-length', JSON.stringify(5));

      renderApp();

      // Open settings
      const headerButtons = document.querySelectorAll(
        'header button, [class*="header"] button, [class*="Header"] button'
      );
      const settingsBtn =
        headerButtons.length > 0
          ? headerButtons[headerButtons.length - 1]
          : document.querySelectorAll('button')[2];

      act(() => {
        fireEvent.click(settingsBtn);
      });

      // Change to word length 4
      const wordLength4Button = screen.getByTestId('word-length-4');
      act(() => {
        fireEvent.click(wordLength4Button);
      });

      // After changing, grid should have 24 cells and no completed rows
      const cells = document.querySelectorAll('[class*="cell"]');
      expect(cells.length).toBe(24);

      const completedCells = document.querySelectorAll('[class*="reveal"]');
      expect(completedCells.length).toBe(0);
    });
  });

  describe('Word length setting persists via localStorage', () => {
    test('word length persists across renders', () => {
      localStorage.setItem('word-length', JSON.stringify(4));
      renderApp();

      const cells = document.querySelectorAll('[class*="cell"]');
      expect(cells.length).toBe(24);

      expect(JSON.parse(localStorage.getItem('word-length'))).toBe(4);
    });

    test('changing word length updates localStorage', () => {
      renderApp();

      // Open settings
      const headerButtons = document.querySelectorAll(
        'header button, [class*="header"] button, [class*="Header"] button'
      );
      const settingsBtn =
        headerButtons.length > 0
          ? headerButtons[headerButtons.length - 1]
          : document.querySelectorAll('button')[2];

      act(() => {
        fireEvent.click(settingsBtn);
      });

      const wordLength6Button = screen.getByTestId('word-length-6');
      act(() => {
        fireEvent.click(wordLength6Button);
      });

      expect(JSON.parse(localStorage.getItem('word-length'))).toBe(6);
    });

    test('default word length is 5 when no localStorage value', () => {
      renderApp();

      const cells = document.querySelectorAll('[class*="cell"]');
      expect(cells.length).toBe(30);
    });
  });
});

describe('Word validation', () => {
  test('only words of the correct length are validated', () => {
    const { isWordValid } = require('lib/words');

    // 5-letter word should be valid for length 5
    expect(isWordValid('WHICH', 5)).toBe(true);

    // 5-letter word should NOT be valid for length 4
    expect(isWordValid('WHICH', 4)).toBe(false);

    // 4-letter word should be valid for length 4
    expect(isWordValid('BACK', 4)).toBe(true);

    // 4-letter word should NOT be valid for length 5
    expect(isWordValid('BACK', 5)).toBe(false);

    // 6-letter word should be valid for length 6
    expect(isWordValid('ACTION', 6)).toBe(true);

    // 6-letter word should NOT be valid for length 5
    expect(isWordValid('ACTION', 5)).toBe(false);
  });
});

describe('getWordOfDay', () => {
  test('returns word of correct length for each word length option', () => {
    const { getWordOfDay } = require('lib/words');

    const word4 = getWordOfDay(4);
    expect(word4.solution.length).toBe(4);

    const word5 = getWordOfDay(5);
    expect(word5.solution.length).toBe(5);

    const word6 = getWordOfDay(6);
    expect(word6.solution.length).toBe(6);
  });

  test('returns consistent solution for the same word length', () => {
    const { getWordOfDay } = require('lib/words');

    const first = getWordOfDay(5);
    const second = getWordOfDay(5);
    expect(first.solution).toBe(second.solution);
    expect(first.solutionIndex).toBe(second.solutionIndex);
  });
});
