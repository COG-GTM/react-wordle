import { useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import useOnClickOutside from './useOnClickOutside';

const Consumer = ({ handler }) => {
  const ref = useRef();

  useOnClickOutside(ref, handler);

  return (
    <div>
      <div ref={ref}>
        inside
        <span>nested</span>
      </div>
      <div>outside</div>
    </div>
  );
};

it('calls the handler when clicking outside the ref', () => {
  const handler = jest.fn();
  render(<Consumer handler={handler} />);

  fireEvent.mouseDown(screen.getByText('outside'));

  expect(handler).toHaveBeenCalledTimes(1);
});

it('ignores clicks on the ref and its descendants', () => {
  const handler = jest.fn();
  render(<Consumer handler={handler} />);

  fireEvent.mouseDown(screen.getByText('nested'));
  fireEvent.touchStart(screen.getByText('nested'));

  expect(handler).not.toHaveBeenCalled();
});

it('reacts to touch events as well', () => {
  const handler = jest.fn();
  render(<Consumer handler={handler} />);

  fireEvent.touchStart(screen.getByText('outside'));

  expect(handler).toHaveBeenCalledTimes(1);
});

it('stops listening once unmounted', () => {
  const handler = jest.fn();
  const { unmount } = render(<Consumer handler={handler} />);

  unmount();
  fireEvent.mouseDown(document.body);

  expect(handler).not.toHaveBeenCalled();
});
