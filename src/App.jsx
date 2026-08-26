import { useState, useEffect, useRef } from 'react';
import Header from 'components/Header';
import Grid from 'components/Grid';
import Keyboard from 'components/Keyboard';
import Alert from 'components/Alert';
import InfoModal from 'components/InfoModal';
import SettingModal from 'components/SettingModal';
import StatsModal from 'components/StatsModal';
import useLocalStorage from 'hooks/useLocalStorage';
import useAlert from 'hooks/useAlert';
import {
  solution as dailySolution,
  solutionIndex,
  isWordValid,
  findFirstUnusedReveal,
  addStatsForCompletedGame,
  getRandomWord,
} from 'lib/words';
import {
  ALERT_DELAY,
  MAX_CHALLENGES,
  MAX_WORD_LENGTH,
} from 'constants/settings';
import styles from './App.module.scss';
import 'styles/_transitionStyles.scss';

const EMPTY_STATS = () => ({
  winDistribution: Array.from(new Array(MAX_CHALLENGES), () => 0),
  gamesFailed: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalGames: 0,
  successRate: 0,
});

function App() {
  const [gameMode, setGameMode] = useLocalStorage('gameMode', 'daily');
  const [boardState, setBoardState] = useLocalStorage('boardState', {
    guesses: [],
    solutionIndex: '',
  });
  const [unlimitedState, setUnlimitedState] = useLocalStorage(
    'unlimitedBoardState',
    {
      guesses: [],
      solution: '',
    }
  );
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  const [highContrast, setHighContrast] = useLocalStorage(
    'high-contrast',
    false
  );
  const [hardMode, setHardMode] = useLocalStorage('hard-mode', false);
  const [stats, setStats] = useLocalStorage('gameStats', EMPTY_STATS());
  const [practiceStats, setPracticeStats] = useLocalStorage(
    'practiceStats',
    EMPTY_STATS()
  );

  const isUnlimitedMode = gameMode === 'unlimited';
  const [unlimitedSolution, setUnlimitedSolution] = useState(
    () => unlimitedState.solution || getRandomWord()
  );
  const solution = isUnlimitedMode ? unlimitedSolution : dailySolution;

  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState(() => {
    if (gameMode === 'unlimited') return unlimitedState.guesses;
    if (boardState.solutionIndex !== solutionIndex) return [];
    return boardState.guesses;
  });
  const [isJiggling, setIsJiggling] = useState(false);
  const [isGameWon, setIsGameWon] = useState(() =>
    guessesInclude(guesses, solution)
  );
  const [isGameLost, setIsGameLost] = useState(
    () =>
      !guessesInclude(guesses, solution) && guesses.length === MAX_CHALLENGES
  );
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHardMode, setIsHardMode] = useState(hardMode);
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');
  const [isHighContrastMode, setIsHighContrastMode] = useState(highContrast);
  const { showAlert } = useAlert();
  const skipEndGameEffect = useRef(true);

  function guessesInclude(guessList, word) {
    return guessList.includes(word.toUpperCase());
  }

  // Show welcome modal
  useEffect(() => {
    if (!boardState.solutionIndex)
      setTimeout(() => setIsInfoModalOpen(true), 1000);
    // eslint-disable-next-line
  }, []);

  // Save board state for the active mode to localStorage
  useEffect(() => {
    if (isUnlimitedMode) {
      setUnlimitedState({
        guesses,
        solution: unlimitedSolution,
      });
    } else {
      setBoardState({
        guesses,
        solutionIndex,
      });
    }
    // eslint-disable-next-line
  }, [guesses, unlimitedSolution]);

  // Check game winning or losing
  useEffect(() => {
    if (skipEndGameEffect.current) {
      skipEndGameEffect.current = false;
      return;
    }

    if (guessesInclude(guesses, solution)) {
      setIsGameWon(true);
      setTimeout(() => showAlert('Well done', 'success'), ALERT_DELAY);
      setTimeout(() => setIsStatsModalOpen(true), ALERT_DELAY + 1000);
    } else if (guesses.length === MAX_CHALLENGES) {
      setIsGameLost(true);
      setTimeout(
        () => showAlert(`The word was ${solution}`, 'error', true),
        ALERT_DELAY
      );
      setTimeout(() => setIsStatsModalOpen(true), ALERT_DELAY + 1000);
    }
    // eslint-disable-next-line
  }, [guesses]);

  useEffect(() => {
    if (isDarkMode) document.body.setAttribute('data-theme', 'dark');
    else document.body.removeAttribute('data-theme');

    if (isHighContrastMode)
      document.body.setAttribute('data-mode', 'high-contrast');
    else document.body.removeAttribute('data-mode');
  }, [isDarkMode, isHighContrastMode]);

  const loadBoard = (mode, activeSolution) => {
    const restoredGuesses =
      mode === 'unlimited'
        ? unlimitedState.guesses
        : boardState.solutionIndex === solutionIndex
        ? boardState.guesses
        : [];

    skipEndGameEffect.current = true;
    setGuesses([...restoredGuesses]);
    setCurrentGuess('');
    setIsGameWon(guessesInclude(restoredGuesses, activeSolution));
    setIsGameLost(
      !guessesInclude(restoredGuesses, activeSolution) &&
        restoredGuesses.length === MAX_CHALLENGES
    );
  };

  const handleGameMode = () => {
    const newMode = isUnlimitedMode ? 'daily' : 'unlimited';
    setGameMode(newMode);
    loadBoard(
      newMode,
      newMode === 'unlimited' ? unlimitedSolution : dailySolution
    );
  };

  const handleNewGame = () => {
    const newWord = getRandomWord();
    setUnlimitedSolution(newWord);
    setUnlimitedState({ guesses: [], solution: newWord });
    skipEndGameEffect.current = true;
    setGuesses([]);
    setCurrentGuess('');
    setIsGameWon(false);
    setIsGameLost(false);
    setIsStatsModalOpen(false);
  };

  const handleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleHighContrastMode = () => {
    setIsHighContrastMode(!isHighContrastMode);
    setHighContrast(!isHighContrastMode);
  };

  const handleHardMode = () => {
    setIsHardMode(!isHardMode);
    setHardMode(!isHardMode);
  };

  const handleKeyDown = letter =>
    currentGuess.length < MAX_WORD_LENGTH &&
    !isGameWon &&
    setCurrentGuess(currentGuess + letter);

  const handleDelete = () =>
    setCurrentGuess(currentGuess.slice(0, currentGuess.length - 1));

  const handleEnter = () => {
    if (isGameWon || isGameLost) return;

    if (currentGuess.length < MAX_WORD_LENGTH) {
      setIsJiggling(true);
      return showAlert('Not enough letters', 'error');
    }

    if (!isWordValid(currentGuess)) {
      setIsJiggling(true);
      return showAlert('Not in word list', 'error');
    }

    if (isHardMode) {
      const firstMissingReveal = findFirstUnusedReveal(
        currentGuess,
        guesses,
        solution
      );
      if (firstMissingReveal) {
        setIsJiggling(true);
        return showAlert(firstMissingReveal, 'error');
      }
    }

    const updateStats = isUnlimitedMode ? setPracticeStats : setStats;
    const activeStats = isUnlimitedMode ? practiceStats : stats;

    if (currentGuess === solution.toUpperCase()) {
      updateStats(addStatsForCompletedGame(activeStats, guesses.length));
    } else if (guesses.length + 1 === MAX_CHALLENGES) {
      updateStats(addStatsForCompletedGame(activeStats, guesses.length + 1));
    }

    setGuesses([...guesses, currentGuess]);
    setCurrentGuess('');
  };

  return (
    <div className={styles.container}>
      <Header
        isUnlimitedMode={isUnlimitedMode}
        setIsInfoModalOpen={setIsInfoModalOpen}
        setIsStatsModalOpen={setIsStatsModalOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
      />
      <Alert />
      <Grid
        currentGuess={currentGuess}
        guesses={guesses}
        solution={solution}
        isJiggling={isJiggling}
        setIsJiggling={setIsJiggling}
      />
      <Keyboard
        onEnter={handleEnter}
        onDelete={handleDelete}
        onKeyDown={handleKeyDown}
        guesses={guesses}
        solution={solution}
      />
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
      <SettingModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isHardMode={isHardMode}
        isDarkMode={isDarkMode}
        isHighContrastMode={isHighContrastMode}
        isUnlimitedMode={isUnlimitedMode}
        setIsHardMode={handleHardMode}
        setIsDarkMode={handleDarkMode}
        setIsHighContrastMode={handleHighContrastMode}
        setIsUnlimitedMode={handleGameMode}
      />
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        gameStats={isUnlimitedMode ? practiceStats : stats}
        numberOfGuessesMade={guesses.length}
        isGameWon={isGameWon}
        isGameLost={isGameLost}
        isHardMode={isHardMode}
        isUnlimitedMode={isUnlimitedMode}
        guesses={guesses}
        solution={solution}
        showAlert={showAlert}
        onNewGame={handleNewGame}
      />
    </div>
  );
}

export default App;
