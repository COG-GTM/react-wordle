import { BsBarChart, BsGear, BsInfoCircle } from 'react-icons/bs';
import AttLogo from 'components/AttLogo';
import './Header.module.scss';

const Header = ({
  setIsInfoModalOpen,
  setIsStatsModalOpen,
  setIsSettingsModalOpen,
}) => {
  return (
    <header>
      <div>
        <button onClick={() => setIsInfoModalOpen(true)}>
          <BsInfoCircle size="1.6rem" color="var(--color-header-text)" />
        </button>
      </div>
      <h1>
        <AttLogo size={36} />
        <span>AT&amp;T Wordle</span>
      </h1>
      <div>
        <button onClick={() => setIsStatsModalOpen(true)}>
          <BsBarChart size="1.6rem" color="var(--color-header-text)" />
        </button>
        <button onClick={() => setIsSettingsModalOpen(true)}>
          <BsGear size="1.6rem" color="var(--color-header-text)" />
        </button>
      </div>
    </header>
  );
};

export default Header;
