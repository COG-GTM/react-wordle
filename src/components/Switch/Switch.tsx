import classNames from 'classnames';
import { useRef } from 'react';
import styles from './Switch.module.scss';

type SwitchProps = {
  isOn: boolean;
  onToggle: () => void;
};

const Switch = ({ isOn, onToggle }: SwitchProps) => {
  const ref = useRef<HTMLInputElement>(null);

  const classes = classNames({
    [styles.label]: true,
    [styles.isOn]: isOn,
  });

  return (
    <>
      <input
        className={styles.switch}
        type="checkbox"
        ref={ref}
        checked={isOn}
        onChange={onToggle}
      />
      <label className={classes} onClick={() => ref.current?.click()}>
        <span className={styles.button} />
      </label>
    </>
  );
};

export default Switch;
