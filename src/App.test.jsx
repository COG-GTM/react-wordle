import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders the game title', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  expect(screen.getByText('WORDLE')).toBeInTheDocument();
});
