import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders wordle game', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  const keyboard = screen.getByText(/enter/i);
  expect(keyboard).toBeInTheDocument();
});
