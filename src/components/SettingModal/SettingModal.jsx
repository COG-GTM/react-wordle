import Modal from 'components/Modal';
import Switch from 'components/Switch';
import styles from './SettingModal.module.scss';

const SettingModal = ({
  isOpen,
  onClose,
  isHardMode,
  isDarkMode,
  isLightModeOnly,
  isHighContrastMode,
  setIsHardMode,
  setIsDarkMode,
  setIsLightModeOnly,
  setIsHighContrastMode,
}) => {
  return (
    <Modal title="Setting" isOpen={isOpen} onClose={onClose}>
      <Row
        title="Hard Mode"
        desc="Any revealed hints must be used in subsequent guesses"
        isOn={isHardMode}
        onToggle={setIsHardMode}
      />
      <Row
        title="Light Mode Only"
        desc="Lock the app to light mode and disable Dark Mode"
        isOn={isLightModeOnly}
        onToggle={setIsLightModeOnly}
      />
      <Row
        title="Dark Mode"
        isOn={isDarkMode}
        onToggle={setIsDarkMode}
        disabled={isLightModeOnly}
      />
      <Row
        title="High Contrast Mode"
        desc="For improved color vision"
        isOn={isHighContrastMode}
        onToggle={setIsHighContrastMode}
      />
    </Modal>
  );
};

const Row = ({ title, desc, isOn, onToggle, disabled }) => {
  return (
    <div className={styles.row}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        <h3 className={styles.desc}>{desc}</h3>
      </div>
      <div>
        <Switch isOn={isOn} onToggle={onToggle} disabled={disabled} />
      </div>
    </div>
  );
};

export default SettingModal;
