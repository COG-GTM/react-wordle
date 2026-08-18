import { render, screen, fireEvent } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

const renderApp = () =>
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );

const toggleUnlimitedMode = () => {
  fireEvent.click(screen.getByLabelText('Settings'));
  // Unlimited Mode is the first switch in the settings modal
  fireEvent.click(screen.getAllByRole('checkbox')[0]);
};

beforeEach(() => {
  window.localStorage.clear();
});

test('renders the game in daily mode by default', () => {
  renderApp();

  expect(screen.getByText('WORDLE')).toBeInTheDocument();
  expect(screen.queryByText('Unlimited')).not.toBeInTheDocument();
});

test('switching to unlimited mode shows the mode indicator and persists', () => {
  renderApp();
  toggleUnlimitedMode();

  expect(screen.getByText('Unlimited')).toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem('gameMode'))).toBe('unlimited');
});

test('mode is restored from localStorage on reload', () => {
  window.localStorage.setItem('gameMode', JSON.stringify('unlimited'));
  renderApp();

  expect(screen.getByText('Unlimited')).toBeInTheDocument();
});

test('board state is stored separately per mode', () => {
  renderApp();
  toggleUnlimitedMode();

  const unlimitedState = JSON.parse(
    window.localStorage.getItem('unlimitedState')
  );
  const boardState = JSON.parse(window.localStorage.getItem('boardState'));

  expect(unlimitedState.solution).toBeTruthy();
  expect(unlimitedState.guesses).toEqual([]);
  expect(boardState.guesses).toEqual([]);
});
