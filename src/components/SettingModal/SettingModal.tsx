import Modal from 'components/Modal';
import Switch from 'components/Switch';
import styles from './SettingModal.module.scss';

type SettingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isHardMode: boolean;
  isDarkMode: boolean;
  isHighContrastMode: boolean;
  setIsHardMode: () => void;
  setIsDarkMode: () => void;
  setIsHighContrastMode: () => void;
};

const SettingModal = ({
  isOpen,
  onClose,
  isHardMode,
  isDarkMode,
  isHighContrastMode,
  setIsHardMode,
  setIsDarkMode,
  setIsHighContrastMode,
}: SettingModalProps) => {
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
    </Modal>
  );
};

type RowProps = {
  title: string;
  desc?: string;
  isOn: boolean;
  onToggle: () => void;
};

const Row = ({ title, desc, isOn, onToggle }: RowProps) => {
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
