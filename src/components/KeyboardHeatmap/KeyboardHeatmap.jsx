import { useMemo } from 'react';
import { computeLetterFrequencies } from 'lib/heatmap';
import styles from './KeyboardHeatmap.module.scss';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const getHeatColor = frequency => {
  if (frequency === 0) return 'transparent';
  const alpha = 0.2 + frequency * 0.6;
  return `rgba(255, ${Math.round(140 - frequency * 100)}, 0, ${alpha})`;
};

const KeyboardHeatmap = ({ guesses }) => {
  const frequencies = useMemo(
    () => computeLetterFrequencies(guesses),
    [guesses]
  );

  return (
    <div className={styles.overlay}>
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.row}>
          {rowIndex === 2 && <div className={styles.spacer} />}
          {row.map(letter => (
            <div
              key={letter}
              className={styles.key}
              style={{
                backgroundColor: getHeatColor(frequencies[letter] || 0),
              }}
            />
          ))}
          {rowIndex === 2 && <div className={styles.spacer} />}
        </div>
      ))}
    </div>
  );
};

export default KeyboardHeatmap;
