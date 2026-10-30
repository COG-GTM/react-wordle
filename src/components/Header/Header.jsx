import { BsBarChart, BsGear, BsInfoCircle } from 'react-icons/bs';
import { formatElapsedTime } from 'lib/time';
import styles from './Header.module.scss';

const Header = ({
  elapsedTime,
  setIsInfoModalOpen,
  setIsStatsModalOpen,
  setIsSettingsModalOpen,
}) => {
  return (
    <header>
      <div>
        <button onClick={() => setIsInfoModalOpen(true)}>
          <BsInfoCircle size="1.6rem" color="var(--color-icon)" />
        </button>
      </div>
      <div className={styles.title}>
        <h1>WORDLE</h1>
        <div className={styles.timer}>
          <span>Time</span>
          <span role="timer" aria-label="Elapsed time">
            {formatElapsedTime(elapsedTime)}
          </span>
        </div>
      </div>
      <div>
        <button onClick={() => setIsStatsModalOpen(true)}>
          <BsBarChart size="1.6rem" color="var(--color-icon)" />
        </button>
        <button onClick={() => setIsSettingsModalOpen(true)}>
          <BsGear size="1.6rem" color="var(--color-icon)" />
        </button>
      </div>
    </header>
  );
};

export default Header;
