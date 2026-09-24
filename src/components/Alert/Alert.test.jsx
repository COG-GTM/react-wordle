import { render, screen } from '@testing-library/react';
import Alert from './Alert';
import { AlertContext } from 'context/AlertContext';

const renderAlert = value =>
  render(
    <AlertContext.Provider value={value}>
      <Alert />
    </AlertContext.Provider>
  );

it('renders nothing while hidden', () => {
  renderAlert({
    message: 'Not in word list',
    status: 'error',
    isVisible: false,
  });

  expect(screen.queryByText('Not in word list')).not.toBeInTheDocument();
});

it('renders an error message', () => {
  renderAlert({
    message: 'Not in word list',
    status: 'error',
    isVisible: true,
  });

  expect(screen.getByText('Not in word list')).toHaveClass('alert', 'error');
});

it('renders a success message', () => {
  renderAlert({ message: 'Well done', status: 'success', isVisible: true });

  expect(screen.getByText('Well done')).toHaveClass('alert', 'success');
});
