import classNames from 'classnames';
import { MAX_WORD_LENGTH } from 'constants/settings';
import styles from './Cell.module.scss';

export const REVEAL_STAGGER_MS = 300;
export const REVEAL_DURATION_MS = 500;
const BOUNCE_STAGGER_MS = 100;

const Cell = ({ value, status, position = 0, isCompleted, isWinning }) => {
  const classes = classNames({
    [styles.cell]: true,
    [styles.absent]: status === 'absent',
    [styles.present]: status === 'present',
    [styles.correct]: status === 'correct',
    [styles.fill]: value,
    [styles.reveal]: isCompleted,
    [styles.bounce]: isWinning,
  });

  const revealEndMs =
    (MAX_WORD_LENGTH - 1) * REVEAL_STAGGER_MS + REVEAL_DURATION_MS;

  const style = {
    '--reveal-delay': `${position * REVEAL_STAGGER_MS}ms`,
    '--reveal-duration': `${REVEAL_DURATION_MS}ms`,
    '--bounce-delay': `${revealEndMs + position * BOUNCE_STAGGER_MS}ms`,
  };

  return (
    <div
      className={classes}
      style={style}
      data-status={status}
      data-testid="cell"
    >
      <span className={styles.letter}>{value}</span>
    </div>
  );
};

export default Cell;
