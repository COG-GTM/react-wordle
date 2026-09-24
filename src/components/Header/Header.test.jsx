import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';

const renderHeader = () => {
  const props = {
    setIsInfoModalOpen: jest.fn(),
    setIsStatsModalOpen: jest.fn(),
    setIsSettingsModalOpen: jest.fn(),
  };
  render(<Header {...props} />);

  return props;
};

it('renders the title and the three actions', () => {
  renderHeader();

  expect(screen.getByRole('heading', { name: 'WORDLE' })).toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(3);
});

it('opens each modal from its button', () => {
  const props = renderHeader();
  const [info, stats, settings] = screen.getAllByRole('button');

  fireEvent.click(info);
  fireEvent.click(stats);
  fireEvent.click(settings);

  expect(props.setIsInfoModalOpen).toHaveBeenCalledWith(true);
  expect(props.setIsStatsModalOpen).toHaveBeenCalledWith(true);
  expect(props.setIsSettingsModalOpen).toHaveBeenCalledWith(true);
});
