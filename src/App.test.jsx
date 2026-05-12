import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders wordle game board', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  const headerElement = screen.getByText(/wordle/i);
  expect(headerElement).toBeInTheDocument();
});
