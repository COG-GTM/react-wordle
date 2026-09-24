import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './Modal';

const renderModal = (props = {}) => {
  const onClose = jest.fn();
  const view = render(
    <div>
      <Modal isOpen title="Statistics" onClose={onClose} {...props}>
        <p>body</p>
      </Modal>
      <button>outside</button>
    </div>
  );

  return { ...view, onClose };
};

it('renders nothing while closed', () => {
  renderModal({ isOpen: false });

  expect(screen.queryByText('Statistics')).not.toBeInTheDocument();
});

it('renders the title and children when open', () => {
  renderModal();

  expect(screen.getByText('Statistics')).toBeInTheDocument();
  expect(screen.getByText('body')).toBeInTheDocument();
});

it('closes on the close button', () => {
  const { onClose } = renderModal();

  fireEvent.click(screen.getAllByRole('button')[0]);

  expect(onClose).toHaveBeenCalledTimes(1);
});

it('closes when clicking outside the modal', () => {
  const { onClose } = renderModal();

  fireEvent.mouseDown(screen.getByText('outside'));

  expect(onClose).toHaveBeenCalledTimes(1);
});

it('stays open when clicking inside the modal', () => {
  const { onClose } = renderModal();

  fireEvent.mouseDown(screen.getByText('body'));

  expect(onClose).not.toHaveBeenCalled();
});
