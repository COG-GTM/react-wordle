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
        <button onClick={() => setIsInfoModalOpen(true)}>
          <BsInfoCircle size="1.6rem" color="var(--color-icon)" />
        </button>
      </div>
      <div className={styles.titleGroup}>
        <h1>WORDLE</h1>
        {isUnlimitedMode && <span className={styles.mode}>UNLIMITED</span>}
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
