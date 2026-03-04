import { render, screen, fireEvent } from '@testing-library/react';
import Keyboard from './Keyboard';

// Mock lib/words so getStatuses doesn't depend on the real solution
jest.mock('lib/words', () => ({
  getStatuses: () => ({}),
}));

describe('Keyboard', () => {
  const defaultProps = {
    onEnter: jest.fn(),
    onDelete: jest.fn(),
    onKeyDown: jest.fn(),
    guesses: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all 26 letter keys plus ENTER and DELETE', () => {
    render(<Keyboard {...defaultProps} />);
    const letters = 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('');
    letters.forEach(letter => {
      expect(screen.getByText(letter)).toBeInTheDocument();
    });
    expect(screen.getByText('ENTER')).toBeInTheDocument();
    expect(screen.getByText('DELETE')).toBeInTheDocument();
  });

  test('clicking a letter key calls onKeyDown with that letter', () => {
    render(<Keyboard {...defaultProps} />);
    fireEvent.click(screen.getByText('A'));
    expect(defaultProps.onKeyDown).toHaveBeenCalledWith('A');
  });

  test('clicking ENTER calls onEnter', () => {
    render(<Keyboard {...defaultProps} />);
    fireEvent.click(screen.getByText('ENTER'));
    expect(defaultProps.onEnter).toHaveBeenCalled();
  });

  test('clicking DELETE calls onDelete', () => {
    render(<Keyboard {...defaultProps} />);
    fireEvent.click(screen.getByText('DELETE'));
    expect(defaultProps.onDelete).toHaveBeenCalled();
  });

  test('physical keyboard: pressing a letter key triggers onKeyDown', () => {
    render(<Keyboard {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'a' });
    expect(defaultProps.onKeyDown).toHaveBeenCalledWith('A');
  });

  test('physical keyboard: pressing Enter triggers onEnter', () => {
    render(<Keyboard {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(defaultProps.onEnter).toHaveBeenCalled();
  });

  test('physical keyboard: pressing Backspace triggers onDelete', () => {
    render(<Keyboard {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Backspace' });
    expect(defaultProps.onDelete).toHaveBeenCalled();
  });
});
