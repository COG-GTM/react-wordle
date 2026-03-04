import { useEffect } from 'react';
import classNames from 'classnames';
import Cell from 'components/Cell';
import { getGuessStatuses } from 'lib/words';
import { MAX_CHALLENGES } from 'constants/settings';
import styles from './Grid.module.scss';

const Grid = ({
  currentGuess,
  guesses,
  isJiggling,
  setIsJiggling,
  wordLength,
  solution,
}) => {
  const empties =
    MAX_CHALLENGES > guesses.length
      ? Array(MAX_CHALLENGES - guesses.length - 1).fill()
      : [];

  useEffect(() => {
    setTimeout(() => {
      if (isJiggling) setIsJiggling(false);
    }, 500);
    // eslint-disable-next-line
  }, [isJiggling]);

  return (
    <div className={styles.grid}>
      {guesses.map((guess, i) => (
        <CompletedRow key={i} guess={guess} solution={solution} />
      ))}
      {guesses.length < MAX_CHALLENGES && (
        <CurrentRow
          guess={currentGuess}
          isJiggling={isJiggling}
          wordLength={wordLength}
        />
      )}
      {empties.map((_, i) => (
        <EmptyRow key={i} wordLength={wordLength} />
      ))}
    </div>
  );
};

const CurrentRow = ({ guess, isJiggling, wordLength }) => {
  const emptyCells = Array(wordLength - guess.length).fill('');
  const cells = [...guess, ...emptyCells];

  const classes = classNames({
    [styles.row]: true,
    [styles.jiggle]: isJiggling,
  });

  const rowStyle = {
    gridTemplateColumns: `repeat(${wordLength}, 1fr)`,
  };

  return (
    <div className={classes} style={rowStyle}>
      {cells.map((letter, index) => (
        <Cell key={index} value={letter} />
      ))}
    </div>
  );
};

const CompletedRow = ({ guess, solution }) => {
  const cells = guess.split('');
  const statuses = getGuessStatuses(guess, solution);
  const rowStyle = {
    gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
  };

  return (
    <div className={styles.row} style={rowStyle}>
      {cells.map((letter, index) => (
        <Cell
          key={index}
          position={index}
          value={letter}
          isCompleted
          status={statuses[index]}
        />
      ))}
    </div>
  );
};

const EmptyRow = ({ wordLength }) => {
  const cells = Array(wordLength).fill();
  const rowStyle = {
    gridTemplateColumns: `repeat(${wordLength}, 1fr)`,
  };

  return (
    <div className={styles.row} style={rowStyle}>
      {cells.map((_, index) => (
        <Cell key={index} />
      ))}
    </div>
  );
};

export default Grid;
