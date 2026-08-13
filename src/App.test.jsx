import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders the game board and keyboard', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  expect(screen.getByText(/wordle/i)).toBeInTheDocument();
  expect(screen.getByText('ENTER')).toBeInTheDocument();
});
