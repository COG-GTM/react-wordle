import { useState, useEffect } from 'react';
import classNames from 'classnames';
import CountDown from 'react-countdown';
import Modal from 'components/Modal';
import styles from './StatsModal.module.scss';
import { shareStatus, tomorrow } from 'lib/words';

const StatsModal = ({
  isOpen,
  onClose,
  gameStats,
  numberOfGuessesMade,
  isGameWon,
  isGameLost,
  isHardMode,
  guesses,
  showAlert,
}) => {
  const handleShare = () => {
    shareStatus(guesses, isGameLost, isHardMode);
    showAlert('Game copied to clipboard', 'success');
  };

  return (
    <Modal title="Statistics" isOpen={isOpen} onClose={onClose}>
      <div className={styles.statsBar}>
        <StatItem label="Played" value={gameStats.totalGames} isOpen={isOpen} />
        <StatItem
          label="Win Rate %"
          value={gameStats.successRate}
          isOpen={isOpen}
        />
        <StatItem
          label="Current Streak"
          value={gameStats.currentStreak}
          isOpen={isOpen}
        />
        <StatItem
          label="Best Streak"
          value={gameStats.bestStreak}
          isOpen={isOpen}
        />
      </div>
      <h2>Guess Distribution</h2>
      <div className={styles.winDistribution}>
        {gameStats.winDistribution.map((value, i) => (
          <Progress
            key={i}
            index={i}
            currentDayStatRow={numberOfGuessesMade === i + 1}
            size={90 * (value / Math.max(...gameStats.winDistribution))}
            label={String(value)}
          />
        ))}
      </div>
      {(isGameWon || isGameLost) && (
        <div className={styles.result}>
          <div className={styles.countDown}>
            <h2>Next word in</h2>
            <CountDown
              date={tomorrow}
              daysInHours={true}
              className={styles.time}
            />
          </div>
          <div className={styles.share}>
            <button onClick={handleShare}>Share</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

const StatItem = ({ label, value, isOpen }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setDisplayValue(0);
      return;
    }

    const target = Number(value) || 0;
    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 500;
    const steps = 20;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      const progress = current / steps;
      setDisplayValue(Math.round(target * progress));
      if (current >= steps) {
        clearInterval(timer);
        setDisplayValue(target);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isOpen, value]);

  return (
    <div className={styles.statItem}>
      <h3 className={styles.value}>{displayValue}</h3>
      <span className={styles.label}>{label}</span>
    </div>
  );
};

const Progress = ({ index, label, size, currentDayStatRow }) => {
  const classes = classNames({
    [styles.line]: true,
    [styles.blue]: currentDayStatRow,
    [styles.gray]: !currentDayStatRow,
  });

  return (
    <div className={styles.progress}>
      <div className={styles.index}>{index + 1}</div>
      <div className={styles.row}>
        <div
          className={classes}
          style={{
            '--bar-width': `${8 + size}%`,
            '--stagger-delay': `${index * 0.1}s`,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
