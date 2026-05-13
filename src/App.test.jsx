import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders wordle app', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  const headerElement = screen.getByText(/wordle/i);
  expect(headerElement).toBeInTheDocument();
});
