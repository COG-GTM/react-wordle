import { BsBarChart, BsGear, BsInfoCircle } from 'react-icons/bs';
import './Header.module.scss';

type HeaderProps = {
  setIsInfoModalOpen: (isOpen: boolean) => void;
  setIsStatsModalOpen: (isOpen: boolean) => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
};

const Header = ({
  setIsInfoModalOpen,
  setIsStatsModalOpen,
  setIsSettingsModalOpen,
}: HeaderProps) => {
  return (
    <header>
      <div>
        <button onClick={() => setIsInfoModalOpen(true)}>
          <BsInfoCircle size="1.6rem" color="var(--color-icon)" />
        </button>
      </div>
      <h1>WORDLE</h1>
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
