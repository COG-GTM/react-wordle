import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders wordle heading', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  const heading = screen.getByText(/wordle/i);
  expect(heading).toBeInTheDocument();
});
