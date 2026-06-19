import Modal from 'components/Modal';
import Switch from 'components/Switch';
import styles from './SettingModal.module.scss';

const SettingModal = ({
  isOpen,
  onClose,
  isHardMode,
  isDarkMode,
  isHighContrastMode,
  isHeatmapMode,
  setIsHardMode,
  setIsDarkMode,
  setIsHighContrastMode,
  setIsHeatmapMode,
}) => {
  return (
    <Modal title="Setting" isOpen={isOpen} onClose={onClose}>
      <Row
        title="Hard Mode"
        desc="Any revealed hints must be used in subsequent guesses"
        isOn={isHardMode}
        onToggle={setIsHardMode}
      />
      <Row title="Dark Mode" isOn={isDarkMode} onToggle={setIsDarkMode} />
      <Row
        title="High Contrast Mode"
        desc="For improved color vision"
        isOn={isHighContrastMode}
        onToggle={setIsHighContrastMode}
      />
      <Row
        title="Keyboard Heatmap"
        desc="Show letter frequency overlay on keyboard"
        isOn={isHeatmapMode}
        onToggle={setIsHeatmapMode}
      />
    </Modal>
  );
};

const Row = ({ title, desc, isOn, onToggle }) => {
  return (
    <div className={styles.row}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        <h3 className={styles.desc}>{desc}</h3>
      </div>
      <div>
        <Switch isOn={isOn} onToggle={onToggle} />
      </div>
    </div>
  );
};

export default SettingModal;
