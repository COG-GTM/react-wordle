import { BsBarChart, BsGear, BsInfoCircle } from 'react-icons/bs';
import styles from './Header.module.scss';

const Header = ({
  setIsInfoModalOpen,
  setIsStatsModalOpen,
  setIsSettingsModalOpen,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.actions}>
        <button
          className={styles.iconButton}
          aria-label="How to play"
          onClick={() => setIsInfoModalOpen(true)}
        >
          <BsInfoCircle size="1.6rem" color="var(--color-icon)" />
        </button>
      </div>
      <h1 className={styles.title}>WORDLE</h1>
      <div className={`${styles.actions} ${styles.actionsEnd}`}>
        <button
          className={styles.iconButton}
          aria-label="Statistics"
          onClick={() => setIsStatsModalOpen(true)}
        >
          <BsBarChart size="1.6rem" color="var(--color-icon)" />
        </button>
        <button
          className={styles.iconButton}
          aria-label="Settings"
          onClick={() => setIsSettingsModalOpen(true)}
        >
          <BsGear size="1.6rem" color="var(--color-icon)" />
        </button>
      </div>
    </header>
  );
};

export default Header;
