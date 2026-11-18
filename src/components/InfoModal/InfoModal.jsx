import Modal from 'components/Modal';
import Cell from 'components/Cell';
import styles from './InfoModal.module.scss';

const EXAMPLES = [
  {
    word: 'WEARY',
    index: 0,
    status: 'correct',
    text: 'is in the word and in the correct spot.',
  },
  {
    word: 'PILLS',
    index: 1,
    status: 'present',
    text: 'is in the word but in the wrong spot.',
  },
  {
    word: 'VAGUE',
    index: 3,
    status: 'absent',
    text: 'is not in the word in any spot.',
  },
];

const InfoModal = ({ isOpen, onClose }) => {
  return (
    <Modal title={'How to play'} isOpen={isOpen} onClose={onClose}>
      <p className={styles.intro}>
        Guess the WORDLE in six tries. Each guess must be a valid five-letter
        word. Hit the enter button to submit. After each guess, the color of the
        tiles will change to show how close your guess was to the word.
      </p>
      <div className={styles.examples}>
        {EXAMPLES.map(({ word, index, status, text }) => (
          <div key={word} className={styles.example}>
            <div className={styles.row}>
              {word
                .split('')
                .map((letter, i) =>
                  i === index ? (
                    <Cell key={i} value={letter} status={status} isCompleted />
                  ) : (
                    <Cell key={i} value={letter} />
                  )
                )}
            </div>
            <p className={styles.caption}>
              The letter <strong>{word[index]}</strong> {text}
            </p>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default InfoModal;
