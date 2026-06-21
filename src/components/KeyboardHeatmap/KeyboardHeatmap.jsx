import styles from './KeyboardHeatmap.module.scss';

const KeyboardHeatmap = ({ frequency }) => {
  const opacity = frequency * 0.7;
  const r = Math.round(255 * frequency);
  const g = Math.round(140 * (1 - frequency));
  const b = Math.round(255 * (1 - frequency));

  return (
    <div
      className={styles.overlay}
      style={{ backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})` }}
    />
  );
};

export default KeyboardHeatmap;
