import { render, screen, act } from '@testing-library/react';
import usePrefersDarkMode from './usePrefersDarkMode';

const Probe = () => <span>{String(usePrefersDarkMode())}</span>;

const mockMatchMedia = matches => {
  const listeners = new Set();
  window.matchMedia = jest.fn(() => ({
    matches,
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
  }));
  return newMatches =>
    act(() => listeners.forEach(listener => listener({ matches: newMatches })));
};

describe('usePrefersDarkMode', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns the current system preference', () => {
    mockMatchMedia(true);
    render(<Probe />);
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('updates when the system preference changes', () => {
    const emitChange = mockMatchMedia(false);
    render(<Probe />);
    expect(screen.getByText('false')).toBeInTheDocument();

    emitChange(true);
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('falls back to light mode when matchMedia is unavailable', () => {
    window.matchMedia = undefined;
    render(<Probe />);
    expect(screen.getByText('false')).toBeInTheDocument();
  });
});
