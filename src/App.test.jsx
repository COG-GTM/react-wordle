import { render, screen } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the game header', () => {
    render(
      <AlertProvider>
        <App />
      </AlertProvider>,
    );
    const headerElement = screen.getByText(/wordle/i);
    expect(headerElement).toBeInTheDocument();
  });
});
