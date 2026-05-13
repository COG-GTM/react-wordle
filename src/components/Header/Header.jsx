import {
  BsBarChart,
  BsGear,
  BsInfoCircle,
  BsPersonCircle,
  BsBoxArrowRight,
} from 'react-icons/bs';
import { useAuth } from 'context/AuthContext';
import styles from './Header.module.scss';

const Header = ({
  setIsInfoModalOpen,
  setIsStatsModalOpen,
  setIsSettingsModalOpen,
  setIsLoginModalOpen,
}) => {
  const { user, logout } = useAuth();

  return (
    <header>
      <div>
        <button onClick={() => setIsInfoModalOpen(true)}>
          <BsInfoCircle size="1.6rem" color="var(--color-icon)" />
        </button>
      </div>
      <h1>WORDLE</h1>
      <div className={styles.actions}>
        {user ? (
          <>
            <span className={styles.username}>{user.username}</span>
            <button onClick={logout} title="Log out">
              <BsBoxArrowRight size="1.6rem" color="var(--color-icon)" />
            </button>
          </>
        ) : (
          <button onClick={() => setIsLoginModalOpen(true)} title="Log in">
            <BsPersonCircle size="1.6rem" color="var(--color-icon)" />
          </button>
        )}
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
