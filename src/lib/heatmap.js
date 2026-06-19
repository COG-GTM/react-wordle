import { getStatuses } from 'lib/words';
import { VALID_GUESSES } from 'constants/validGuesses';

export const computeLetterFrequencies = guesses => {
  const statuses = getStatuses(guesses);

  const absentLetters = new Set();
  const presentLetters = {};

  Object.entries(statuses).forEach(([letter, status]) => {
    const lowerLetter = letter.toLowerCase();
    if (status === 'absent') {
      absentLetters.add(lowerLetter);
    } else if (status === 'present') {
      if (!presentLetters[lowerLetter]) {
        presentLetters[lowerLetter] = new Set();
      }
    }
  });

  // Track positions where present letters were guessed (they can't be there)
  guesses.forEach(word => {
    word
      .toLowerCase()
      .split('')
      .forEach((letter, i) => {
        if (presentLetters[letter]) {
          presentLetters[letter].add(i);
        }
      });
  });

  // Build correct positions map from guesses
  const correctPositions = {};
  guesses.forEach(word => {
    const chars = word.toUpperCase().split('');
    chars.forEach((letter, i) => {
      if (statuses[letter] === 'correct') {
        correctPositions[i] = letter.toLowerCase();
      }
    });
  });

  // Filter valid guesses by constraints
  const filtered = VALID_GUESSES.filter(word => {
    const chars = word.split('');

    // Exclude words containing absent letters
    for (const ch of chars) {
      if (absentLetters.has(ch)) return false;
    }

    // Must have correct letters in their exact positions
    for (const [pos, letter] of Object.entries(correctPositions)) {
      if (chars[parseInt(pos)] !== letter) return false;
    }

    // Must contain present letters but not in excluded positions
    for (const [letter, excludedPositions] of Object.entries(presentLetters)) {
      if (!chars.includes(letter)) return false;
      for (const pos of excludedPositions) {
        if (chars[pos] === letter) return false;
      }
    }

    return true;
  });

  // Compute per-letter frequency
  const counts = {};
  for (let i = 0; i < 26; i++) {
    counts[String.fromCharCode(65 + i)] = 0;
  }

  filtered.forEach(word => {
    const seen = new Set();
    word.split('').forEach(ch => {
      const upper = ch.toUpperCase();
      if (!seen.has(upper)) {
        counts[upper]++;
        seen.add(upper);
      }
    });
  });

  // Normalize to 0-1 scale
  const maxCount = Math.max(...Object.values(counts), 1);
  const frequencies = {};
  for (const [letter, count] of Object.entries(counts)) {
    frequencies[letter] = count / maxCount;
  }

  return frequencies;
};
