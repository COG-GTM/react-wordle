import Modal from 'components/Modal';
import Switch from 'components/Switch';
import styles from './SettingModal.module.scss';

const SettingModal = ({
  isOpen,
  onClose,
  isHardMode,
  isDarkMode,
  isHighContrastMode,
  setIsHardMode,
  setIsDarkMode,
  setIsHighContrastMode,
}) => {
  return (
    <Modal title="Settings" isOpen={isOpen} onClose={onClose}>
      <div className={styles.list}>
        <Row
          title="Hard Mode"
          desc="Any revealed hints must be used in subsequent guesses"
          isOn={isHardMode}
          onToggle={setIsHardMode}
        />
        <Row
          title="Dark Mode"
          desc="Easier on the eyes at night"
          isOn={isDarkMode}
          onToggle={setIsDarkMode}
        />
        <Row
          title="High Contrast Mode"
          desc="For improved color vision"
          isOn={isHighContrastMode}
          onToggle={setIsHighContrastMode}
        />
      </div>
    </Modal>
  );
};

const Row = ({ title, desc, isOn, onToggle }) => {
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <h2 className={styles.title}>{title}</h2>
        {desc && <p className={styles.desc}>{desc}</p>}
      </div>
      <Switch isOn={isOn} onToggle={onToggle} label={title} />
    </div>
  );
};

export default SettingModal;
