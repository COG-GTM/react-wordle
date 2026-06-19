import classnames from 'classnames';
import styles from './StreakBadge.module.scss';

const StreakBadge = ({ currentStreak }) => {
  const isOnFire = currentStreak >= 3;

  return (
    <div className={styles.streakBadge}>
      <span className={styles.streakNumber}>{currentStreak}</span>
      {isOnFire && (
        <span className={classnames(styles.flame, styles.pulse)}>🔥</span>
      )}
    </div>
  );
};

export default StreakBadge;
