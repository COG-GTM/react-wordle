import { BsBarChart, BsGear, BsInfoCircle } from 'react-icons/bs';
import styles from './Header.module.scss';

const Header = ({
  isUnlimitedMode,
  setIsInfoModalOpen,
  setIsStatsModalOpen,
  setIsSettingsModalOpen,
}) => {
  return (
    <header>
      <div>
        <button aria-label="Info" onClick={() => setIsInfoModalOpen(true)}>
          <BsInfoCircle size="1.6rem" color="var(--color-icon)" />
        </button>
      </div>
      <h1>
        WORDLE
        {isUnlimitedMode && <span className={styles.mode}>Unlimited</span>}
      </h1>
      <div>
        <button
          aria-label="Statistics"
          onClick={() => setIsStatsModalOpen(true)}
        >
          <BsBarChart size="1.6rem" color="var(--color-icon)" />
        </button>
        <button
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
