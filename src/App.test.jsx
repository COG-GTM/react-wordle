import { render } from '@testing-library/react';
import { AlertProvider } from 'context/AlertContext';
import App from './App';

test('renders the App without crashing', () => {
  const { container } = render(
    <AlertProvider>
      <App />
    </AlertProvider>
  );
  expect(container).not.toBeEmptyDOMElement();
});
