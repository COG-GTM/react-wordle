import { render } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders without crashing', () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
});
