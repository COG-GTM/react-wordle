import { render, screen, fireEvent } from '@testing-library/react';
import SettingModal from './SettingModal';

const renderSettingModal = (props = {}) => {
  const handlers = {
    setIsHardMode: jest.fn(),
    setIsDarkMode: jest.fn(),
    setIsHighContrastMode: jest.fn(),
  };
  render(
    <SettingModal
      isOpen
      onClose={jest.fn()}
      isHardMode={false}
      isDarkMode={true}
      isHighContrastMode={false}
      {...handlers}
      {...props}
    />
  );

  return handlers;
};

it('renders a switch per setting reflecting its state', () => {
  renderSettingModal();

  const [hardMode, darkMode, highContrast] = screen.getAllByRole('checkbox');
  expect(screen.getByText('Hard Mode')).toBeInTheDocument();
  expect(hardMode).not.toBeChecked();
  expect(darkMode).toBeChecked();
  expect(highContrast).not.toBeChecked();
});

it('toggles the matching setting', () => {
  const handlers = renderSettingModal();
  const [hardMode, , highContrast] = screen.getAllByRole('checkbox');

  fireEvent.click(hardMode);
  fireEvent.click(highContrast);

  expect(handlers.setIsHardMode).toHaveBeenCalledTimes(1);
  expect(handlers.setIsHighContrastMode).toHaveBeenCalledTimes(1);
  expect(handlers.setIsDarkMode).not.toHaveBeenCalled();
});
