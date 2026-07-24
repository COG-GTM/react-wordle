import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders the Wordle app', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  expect(screen.getByRole('heading', { name: /wordle/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /enter/i })).toBeInTheDocument();
});
