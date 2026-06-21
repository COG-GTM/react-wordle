import { IoFlame } from 'react-icons/io5';
import styles from './StreakBadge.module.scss';

const StreakBadge = ({ streak }) => {
  if (!streak) return null;

  const isOnFire = streak >= 3;

  return (
    <div className={styles.streakBadge}>
      <IoFlame
        className={isOnFire ? styles.flamePulse : styles.flame}
        size="1.4rem"
        color={isOnFire ? '#f97316' : 'var(--color-icon)'}
      />
      <span className={styles.count}>{streak}</span>
    </div>
  );
};

export default StreakBadge;
