import { BsBarChart, BsGear, BsInfoCircle, BsLightbulb } from 'react-icons/bs';
import './Header.module.scss';

const Header = ({
  setIsInfoModalOpen,
  setIsStatsModalOpen,
  setIsSettingsModalOpen,
  onHint,
  isHintDisabled,
  isHintUsed,
}) => {
  return (
    <header>
      <div>
        <button onClick={() => setIsInfoModalOpen(true)}>
          <BsInfoCircle size="1.6rem" color="var(--color-icon)" />
        </button>
        <button
          onClick={onHint}
          disabled={isHintDisabled}
          aria-label={isHintUsed ? 'Hint used' : 'Reveal a hint'}
          title={
            isHintUsed
              ? 'Hint used for this game'
              : 'Reveal one correct letter (1 hint per game)'
          }
        >
          <BsLightbulb size="1.6rem" color="var(--color-icon)" />
        </button>
      </div>
      <h1>WORDLE</h1>
      <div>
        <button
          onClick={() => setIsStatsModalOpen(true)}
          aria-label="Statistics"
        >
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
