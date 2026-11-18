import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { FiDelete } from 'react-icons/fi';
import { getStatuses } from 'lib/words';
import styles from './Keyboard.module.scss';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE'],
];

const PRESS_DURATION = 120;

const Keyboard = ({ onEnter, onDelete, onKeyDown, guesses }) => {
  const charStatuses = getStatuses(guesses);
  const [pressedKey, setPressedKey] = useState(null);
  const pressTimeout = useRef();

  const flashKey = key => {
    clearTimeout(pressTimeout.current);
    setPressedKey(key);
    pressTimeout.current = setTimeout(
      () => setPressedKey(null),
      PRESS_DURATION
    );
  };

  useEffect(() => () => clearTimeout(pressTimeout.current), []);

  useEffect(() => {
    const listener = e => {
      const key = e.key.toUpperCase();
      if (key === 'BACKSPACE') {
        flashKey('DELETE');
        return onDelete();
      }
      if (key === 'ENTER') {
        flashKey('ENTER');
        return onEnter();
      }
      if (key.length === 1 && key >= 'A' && key <= 'Z') {
        flashKey(key);
        onKeyDown(key);
      }
    };

    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  });

  const handleClick = key => {
    if (key === 'ENTER') return onEnter();
    if (key === 'DELETE') return onDelete();

    onKeyDown(key);
  };

  return (
    <div className={styles.keyboard} role="group" aria-label="Keyboard">
      {ROWS.map((row, i) => (
        <div className={styles.row} key={i}>
          {row.map(value => (
            <Key
              key={value}
              value={value}
              status={charStatuses[value]}
              isPressed={pressedKey === value}
              onClick={handleClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const Key = ({ value, status, isPressed, onClick }) => {
  const isEnter = value === 'ENTER';
  const isDelete = value === 'DELETE';

  const classes = classNames({
    [styles.key]: true,
    [styles.absent]: status === 'absent',
    [styles.present]: status === 'present',
    [styles.correct]: status === 'correct',
    [styles.action]: isEnter || isDelete,
    [styles.enter]: isEnter,
    [styles.pressed]: isPressed,
  });

  const handleClick = e => {
    // Drop focus so a later physical Enter doesn't re-trigger this button.
    e.currentTarget.blur();
    onClick(value);
  };

  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      aria-label={isDelete ? 'Backspace' : isEnter ? 'Enter' : value}
      data-key={value}
      data-state={status || 'unused'}
    >
      {isDelete ? <FiDelete className={styles.icon} aria-hidden /> : value}
    </button>
  );
};

export default Keyboard;
