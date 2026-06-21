import { VALID_GUESSES } from 'constants/validGuesses';
import { WORDS } from 'constants/wordList';
import { getGuessStatuses } from 'lib/words';

export const computeLetterFrequencies = guesses => {
  const absentLetters = new Set();
  const correctPositions = {};
  const presentLetters = new Set();
  const presentNotAt = {};

  guesses.forEach(guess => {
    const statuses = getGuessStatuses(guess);
    const letters = guess.toLowerCase().split('');

    letters.forEach((letter, i) => {
      if (statuses[i] === 'correct') {
        correctPositions[i] = letter;
      } else if (statuses[i] === 'present') {
        presentLetters.add(letter);
        if (!presentNotAt[letter]) presentNotAt[letter] = new Set();
        presentNotAt[letter].add(i);
      } else if (statuses[i] === 'absent') {
        absentLetters.add(letter);
      }
    });
  });

  // Remove letters from absent set if they also appear as correct/present
  for (const letter of presentLetters) {
    absentLetters.delete(letter);
  }
  for (const pos in correctPositions) {
    absentLetters.delete(correctPositions[pos]);
  }

  const allWords = [...VALID_GUESSES, ...WORDS];

  const matchesConstraints = word => {
    const letters = word.split('');

    for (const letter of letters) {
      if (absentLetters.has(letter)) return false;
    }

    for (const pos in correctPositions) {
      if (letters[pos] !== correctPositions[pos]) return false;
    }

    for (const letter of presentLetters) {
      if (!letters.includes(letter)) return false;
      if (presentNotAt[letter]) {
        for (const pos of presentNotAt[letter]) {
          if (letters[pos] === letter) return false;
        }
      }
    }

    return true;
  };

  const remaining = allWords.filter(matchesConstraints);

  const counts = {};
  for (let c = 65; c <= 90; c++) {
    counts[String.fromCharCode(c)] = 0;
  }

  remaining.forEach(word => {
    word
      .toUpperCase()
      .split('')
      .forEach(letter => {
        counts[letter]++;
      });
  });

  const max = Math.max(...Object.values(counts), 1);

  const frequencies = {};
  for (const letter in counts) {
    frequencies[letter] = counts[letter] / max;
  }

  return frequencies;
};
