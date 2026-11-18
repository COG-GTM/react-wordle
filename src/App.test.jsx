import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders the game header', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
});
