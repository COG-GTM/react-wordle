import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import { AuthProvider } from 'context/AuthContext';
import App from './App';

test('renders wordle heading', () => {
  render(
    <AuthProvider>
      <AlertProvider>
        <App />
      </AlertProvider>
    </AuthProvider>
  );
  const heading = screen.getByText(/wordle/i);
  expect(heading).toBeInTheDocument();
});
