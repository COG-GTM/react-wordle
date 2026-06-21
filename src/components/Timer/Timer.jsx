import styles from './Timer.module.scss';

const Timer = ({ elapsedTime }) => {
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`;

  return <div className={styles.timer}>{formatted}</div>;
};

export default Timer;
