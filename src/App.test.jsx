import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

describe('App', () => {
  test('renders without crashing', () => {
    render(
      <AlertProvider>
        <App />
      </AlertProvider>
    );
  });

  test('shows the header/title', () => {
    render(
      <AlertProvider>
        <App />
      </AlertProvider>
    );
    expect(screen.getByText('WORDLE')).toBeInTheDocument();
  });
});
