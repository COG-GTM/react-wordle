import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders the game board', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  expect(screen.getByRole('heading', { name: 'WORDLE' })).toBeInTheDocument();
});
