import { render, screen, fireEvent } from '@testing-library/react';
import Switch from './Switch';

it('reflects the on state', () => {
  render(<Switch isOn onToggle={() => {}} />);

  expect(screen.getByRole('checkbox')).toBeChecked();
});

it('reflects the off state', () => {
  render(<Switch isOn={false} onToggle={() => {}} />);

  expect(screen.getByRole('checkbox')).not.toBeChecked();
});

it('toggles when the checkbox changes', () => {
  const onToggle = jest.fn();
  render(<Switch isOn={false} onToggle={onToggle} />);

  fireEvent.click(screen.getByRole('checkbox'));

  expect(onToggle).toHaveBeenCalledTimes(1);
});

it('toggles when the label is clicked', () => {
  const onToggle = jest.fn();
  const { container } = render(<Switch isOn onToggle={onToggle} />);

  fireEvent.click(container.querySelector('label'));

  expect(onToggle).toHaveBeenCalledTimes(1);
  expect(container.querySelector('label')).toHaveClass('isOn');
});
