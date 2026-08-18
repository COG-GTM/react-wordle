import { MAX_WORD_LENGTH, VALID_GUESSES, WORDS } from './clientConstants.js';

const ACCEPTED_GUESSES = new Set([...WORDS, ...VALID_GUESSES]);

export const isGuessAccepted = guess =>
  typeof guess === 'string' &&
  guess.length === MAX_WORD_LENGTH &&
  ACCEPTED_GUESSES.has(guess.toLowerCase());

// Mirrors the client's getGuessStatuses (src/lib/words.js), including its
// duplicate-letter handling, but takes the word as an argument because the relay
// is the only holder of the versus word.
export const scoreGuess = (guess, word) => {
  const splitGuess = guess.toLowerCase().split('');
  const splitWord = word.toLowerCase().split('');

  const statuses = [];
  const wordCharsTaken = splitWord.map(() => false);

  splitGuess.forEach((letter, i) => {
    if (letter === splitWord[i]) {
      statuses[i] = 'correct';
      wordCharsTaken[i] = true;
    }
  });

  splitGuess.forEach((letter, i) => {
    if (statuses[i]) return;

    const indexOfPresentChar = splitWord.findIndex(
      (candidate, index) => candidate === letter && !wordCharsTaken[index]
    );

    if (indexOfPresentChar > -1) {
      statuses[i] = 'present';
      wordCharsTaken[indexOfPresentChar] = true;
      return;
    }

    statuses[i] = 'absent';
  });

  return statuses;
};

export const isSolved = statuses =>
  statuses.length === MAX_WORD_LENGTH &&
  statuses.every(status => status === 'correct');

export const pickWord = (
  randomIndex = max => Math.floor(Math.random() * max)
) => WORDS[randomIndex(WORDS.length)];
