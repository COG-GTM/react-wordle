import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders the Wordle header', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  const heading = screen.getByRole('heading', { name: /wordle/i });
  expect(heading).toBeInTheDocument();
});
