import classNames from 'classnames';
import styles from './Switch.module.scss';

const Switch = ({ isOn, onToggle, label }) => {
  const classes = classNames({
    [styles.label]: true,
    [styles.isOn]: isOn,
  });

  return (
    <label className={classes}>
      <input
        className={styles.switch}
        type="checkbox"
        role="switch"
        aria-checked={isOn}
        aria-label={label}
        checked={isOn}
        onChange={onToggle}
      />
      <span className={styles.track}>
        <span className={styles.button} />
      </span>
    </label>
  );
};

export default Switch;
