import { MAX_CHALLENGES } from 'constants/settings';
import { VALID_GUESSES } from 'constants/validGuesses';
import { WORDS } from 'constants/wordList';
import { VALID_GUESSES_4 } from 'constants/validGuesses4';
import { WORDS_4 } from 'constants/wordList4';
import { VALID_GUESSES_6 } from 'constants/validGuesses6';
import { WORDS_6 } from 'constants/wordList6';

const getWordListForLength = wordLength => {
  switch (wordLength) {
    case 4:
      return WORDS_4;
    case 6:
      return WORDS_6;
    case 5:
    default:
      return WORDS;
  }
};

const getValidGuessesForLength = wordLength => {
  switch (wordLength) {
    case 4:
      return VALID_GUESSES_4;
    case 6:
      return VALID_GUESSES_6;
    case 5:
    default:
      return VALID_GUESSES;
  }
};

export const isWordValid = (word, wordLength = 5) => {
  const validGuesses = getValidGuessesForLength(wordLength);
  const wordList = getWordListForLength(wordLength);
  return (
    validGuesses.includes(word.toLowerCase()) ||
    wordList.includes(word.toLowerCase())
  );
};

export const getGuessStatuses = (guess, currentSolution) => {
  const sol = currentSolution || solution;
  const splitGuess = guess.toLowerCase().split('');
  const splitSolution = sol.split('');

  const statuses = [];
  const solutionCharsTaken = splitSolution.map(_ => false);

  // handle all correct cases first
  splitGuess.forEach((letter, i) => {
    if (letter === splitSolution[i]) {
      statuses[i] = 'correct';
      solutionCharsTaken[i] = true;
      return;
    }
  });

  splitGuess.forEach((letter, i) => {
    if (statuses[i]) return;

    if (!splitSolution.includes(letter)) {
      // handles the absent case
      statuses[i] = 'absent';
      return;
    }

    // now we are left with "present"s
    const indexOfPresentChar = splitSolution.findIndex(
      (x, index) => x === letter && !solutionCharsTaken[index]
    );

    if (indexOfPresentChar > -1) {
      statuses[i] = 'present';
      solutionCharsTaken[indexOfPresentChar] = true;
      return;
    } else {
      statuses[i] = 'absent';
      return;
    }
  });

  return statuses;
};

export const getStatuses = (guesses, currentSolution) => {
  const sol = currentSolution || solution;
  const charObj = {};
  const splitSolution = sol.toUpperCase().split('');

  guesses.forEach(word => {
    word.split('').forEach((letter, i) => {
      if (!splitSolution.includes(letter)) return (charObj[letter] = 'absent');
      if (letter === splitSolution[i]) return (charObj[letter] = 'correct');
      if (charObj[letter] !== 'correct') return (charObj[letter] = 'present');
    });
  });

  return charObj;
};

// build a set of previously revealed letters - present and correct
// guess must use correct letters in that space and any other revealed letters
// also check if all revealed instances of a letter are used (i.e. two C's)
export const findFirstUnusedReveal = (word, guesses, currentSolution) => {
  if (guesses.length === 0) {
    return false;
  }

  const lettersLeftArray = [];
  const guess = guesses[guesses.length - 1];
  const statuses = getGuessStatuses(guess, currentSolution);
  const splitWord = word.toUpperCase().split('');
  const splitGuess = guess.toUpperCase().split('');

  for (let i = 0; i < splitGuess.length; i++) {
    if (statuses[i] === 'correct' || statuses[i] === 'present')
      lettersLeftArray.push(splitGuess[i]);

    if (statuses[i] === 'correct' && splitWord[i] !== splitGuess[i])
      return `Must use ${splitGuess[i]} in position ${i + 1}`;
  }

  // check for the first unused letter, taking duplicate letters
  // into account - see issue #198
  let n;
  for (const letter of splitWord) {
    n = lettersLeftArray.indexOf(letter);
    if (n !== -1) {
      lettersLeftArray.splice(n, 1);
    }
  }

  if (lettersLeftArray.length > 0)
    return `Guess must contain ${lettersLeftArray[0]}`;

  return false;
};

export const addStatsForCompletedGame = (gameStats, count) => {
  // Count is number of incorrect guesses before end.
  const stats = { ...gameStats };

  stats.totalGames += 1;

  if (count >= MAX_CHALLENGES) {
    // A fail situation
    stats.currentStreak = 0;
    stats.gamesFailed += 1;
  } else {
    stats.winDistribution[count] += 1;
    stats.currentStreak += 1;

    if (stats.bestStreak < stats.currentStreak) {
      stats.bestStreak = stats.currentStreak;
    }
  }

  stats.successRate = getSuccessRate(stats);

  return stats;
};

const getSuccessRate = gameStats => {
  const { totalGames, gamesFailed } = gameStats;

  return Math.round(
    (100 * (totalGames - gamesFailed)) / Math.max(totalGames, 1)
  );
};

export const shareStatus = (
  guesses,
  isGameLost,
  isHardMode,
  currentSolution
) => {
  const textToShare =
    `Wordle Game
#${solutionIndex} 
${isGameLost ? 'X' : guesses.length}/${MAX_CHALLENGES} 
${isHardMode ? 'Hard Mode' : ''}
\n` + generateEmojiGrid(guesses, currentSolution);

  navigator.clipboard.writeText(textToShare);
};

export const generateEmojiGrid = (guesses, currentSolution) => {
  return guesses
    .map(guess => {
      const status = getGuessStatuses(guess, currentSolution);
      const splitGuess = guess.split('');

      return splitGuess
        .map((_, i) => {
          switch (status[i]) {
            case 'correct':
              return '🟩';
            case 'present':
              return '🟨';
            default:
              return '⬜';
          }
        })
        .join('');
    })
    .join('\n');
};

export const getWordOfDay = (wordLength = 5) => {
  const wordList = getWordListForLength(wordLength);
  // January 1, 2022 Game Epoch
  const epochMs = new Date(2022, 0).valueOf();
  const now = Date.now();
  const msInDay = 86400000;
  const index = Math.floor((now - epochMs) / msInDay);
  const nextday = (index + 1) * msInDay + epochMs;

  return {
    solution: wordList[index % wordList.length],
    solutionIndex: index,
    tomorrow: nextday,
  };
};

export const { solution, solutionIndex, tomorrow } = getWordOfDay();
