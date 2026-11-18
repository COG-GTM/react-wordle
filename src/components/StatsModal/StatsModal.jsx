import classNames from 'classnames';
import CountDown, { zeroPad } from 'react-countdown';
import { RiShareLine } from 'react-icons/ri';
import Modal from 'components/Modal';
import styles from './StatsModal.module.scss';
import { solutionIndex, tomorrow } from 'lib/words';
import { copyToClipboard, getShareText } from './share';

const StatsModal = ({
  isOpen,
  onClose,
  gameStats,
  numberOfGuessesMade,
  isGameWon,
  isGameLost,
  isHardMode,
  isHighContrastMode,
  guesses,
  showAlert,
}) => {
  const isGameFinished = isGameWon || isGameLost;
  const maxDistribution = Math.max(...gameStats.winDistribution, 0);

  const handleShare = async () => {
    const text = getShareText({
      guesses,
      solutionIndex,
      isGameLost,
      isHardMode,
      isHighContrastMode,
    });

    try {
      await copyToClipboard(text);
      showAlert('Copied to clipboard', 'success');
    } catch (e) {
      showAlert('Could not copy results', 'error');
    }
  };

  return (
    <Modal title="Statistics" isOpen={isOpen} onClose={onClose}>
      <div className={styles.statsBar}>
        <StatItem label="Played" value={gameStats.totalGames} />
        <StatItem label="Win %" value={gameStats.successRate} />
        <StatItem label="Current streak" value={gameStats.currentStreak} />
        <StatItem label="Best streak" value={gameStats.bestStreak} />
      </div>
      <h3 className={styles.sectionTitle}>Guess distribution</h3>
      <div className={styles.winDistribution} data-testid="win-distribution">
        {gameStats.winDistribution.map((value, i) => (
          <Progress
            key={i}
            index={i}
            value={value}
            max={maxDistribution}
            isCurrentGame={isGameWon && numberOfGuessesMade === i + 1}
          />
        ))}
      </div>
      {isGameFinished && (
        <div className={styles.result}>
          <div className={styles.countDown}>
            <span className={styles.countDownLabel}>Next word in</span>
            <CountDown
              date={tomorrow}
              renderer={({ hours, minutes, seconds, days }) => (
                <span className={styles.time}>
                  {zeroPad(days * 24 + hours)}:{zeroPad(minutes)}:
                  {zeroPad(seconds)}
                </span>
              )}
            />
          </div>
          <button className={styles.shareButton} onClick={handleShare}>
            Share
            <RiShareLine size="1.2rem" aria-hidden="true" />
          </button>
        </div>
      )}
    </Modal>
  );
};

const StatItem = ({ label, value }) => {
  return (
    <div className={styles.statItem}>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
};

const Progress = ({ index, value, max, isCurrentGame }) => {
  const width = max > 0 ? (100 * value) / max : 0;

  return (
    <div className={styles.progress}>
      <div className={styles.index}>{index + 1}</div>
      <div className={styles.track}>
        <div
          className={classNames(styles.bar, {
            [styles.current]: isCurrentGame,
          })}
          style={{ width: `${width}%` }}
          data-testid={`distribution-bar-${index + 1}`}
          data-current={isCurrentGame ? 'true' : undefined}
        >
          <span className={styles.barLabel}>{value}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
