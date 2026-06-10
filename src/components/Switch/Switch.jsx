import classNames from 'classnames';
import { useRef } from 'react';
import styles from './Switch.module.scss';

const Switch = ({ isOn, onToggle, disabled }) => {
  const ref = useRef();

  const classes = classNames({
    [styles.label]: true,
    [styles.isOn]: isOn,
    [styles.disabled]: disabled,
  });

  return (
    <>
      <input
        className={styles.switch}
        type="checkbox"
        ref={ref}
        checked={isOn}
        onChange={onToggle}
        disabled={disabled}
      />
      <label
        className={classes}
        onClick={() => !disabled && ref.current.click()}
      >
        <span className={styles.button} />
      </label>
    </>
  );
};

export default Switch;
