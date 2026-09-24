import { render, screen, fireEvent, act } from '@testing-library/react';
import { AlertProvider } from './AlertContext';
import useAlert from 'hooks/useAlert';

const Consumer = ({ persist }) => {
  const { message, status, isVisible, showAlert } = useAlert();

  return (
    <>
      <span data-testid="state">{`${message}|${status}|${isVisible}`}</span>
      <button onClick={() => showAlert('Not in word list', 'error', persist)}>
        show
      </button>
    </>
  );
};

const state = () => screen.getByTestId('state').textContent;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('starts hidden with no message', () => {
  render(
    <AlertProvider>
      <Consumer />
    </AlertProvider>
  );

  expect(state()).toBe('||false');
});

it('shows an alert and hides it again after the delay', () => {
  render(
    <AlertProvider>
      <Consumer />
    </AlertProvider>
  );

  fireEvent.click(screen.getByText('show'));
  expect(state()).toBe('Not in word list|error|true');

  act(() => jest.advanceTimersByTime(2000));
  expect(state()).toBe('Not in word list|error|false');
});

it('keeps a persistent alert visible', () => {
  render(
    <AlertProvider>
      <Consumer persist />
    </AlertProvider>
  );

  fireEvent.click(screen.getByText('show'));
  act(() => jest.advanceTimersByTime(10000));

  expect(state()).toBe('Not in word list|error|true');
});
