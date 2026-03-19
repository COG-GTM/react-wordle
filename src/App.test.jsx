import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders wordle title', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  const titleElement = screen.getByText(/WORDLE/i);
  expect(titleElement).toBeInTheDocument();
});
