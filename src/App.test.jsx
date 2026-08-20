import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { AlertProvider } from 'context/AlertContext';

const renderApp = () =>
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );

beforeEach(() => {
  localStorage.clear();
});

test('renders the game in daily mode by default', () => {
  renderApp();
  expect(screen.getByText('WORDLE')).toBeInTheDocument();
  expect(screen.queryByText('Unlimited')).not.toBeInTheDocument();
});

test('shows the Unlimited indicator and persists mode after toggling', () => {
  renderApp();
  fireEvent.click(screen.getAllByRole('button')[2]); // settings
  fireEvent.click(screen.getAllByRole('checkbox')[0]); // unlimited toggle
  expect(screen.getByText('Unlimited')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('gameMode'))).toBe('unlimited');
});

test('keeps daily board state isolated when switching modes', () => {
  localStorage.setItem(
    'unlimitedState',
    JSON.stringify({ guesses: ['CRANE'], solution: 'spilt' })
  );
  localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  renderApp();
  // 'C' appears on both the keyboard and the restored guess row
  expect(screen.getAllByText('C').length).toBeGreaterThan(1);

  fireEvent.click(screen.getAllByRole('button')[2]); // settings
  fireEvent.click(screen.getAllByRole('checkbox')[0]); // back to daily
  expect(screen.queryByText('Unlimited')).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('unlimitedState')).guesses).toEqual([
    'CRANE',
  ]);
});
