import { useState, useEffect } from 'react';
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

function App() {
  const [gameMode, setGameMode] = useLocalStorage('gameMode', 'daily');
  const [boardState, setBoardState] = useLocalStorage('boardState', {
    guesses: [],
    solutionIndex: '',
  });
  const [unlimitedBoardState, setUnlimitedBoardState] = useLocalStorage(
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
  const [stats, setStats] = useLocalStorage('gameStats', {
    winDistribution: Array.from(new Array(MAX_CHALLENGES), () => 0),
    gamesFailed: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGames: 0,
    successRate: 0,
  });
  const [practiceStats, setPracticeStats] = useLocalStorage('practiceStats', {
    winDistribution: Array.from(new Array(MAX_CHALLENGES), () => 0),
    gamesFailed: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGames: 0,
    successRate: 0,
  });
  const [unlimitedSolution, setUnlimitedSolution] = useState(
    () => unlimitedBoardState.solution || getRandomWord()
  );
  const isUnlimitedMode = gameMode === 'unlimited';
  const solution = isUnlimitedMode ? unlimitedSolution : dailySolution;
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState(() => {
    if (isUnlimitedMode) {
      if (unlimitedBoardState.solution !== unlimitedSolution) return [];
      return unlimitedBoardState.guesses;
    }
    if (boardState.solutionIndex !== solutionIndex) return [];
    return boardState.guesses;
  });
  const [isJiggling, setIsJiggling] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isGameLost, setIsGameLost] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHardMode, setIsHardMode] = useState(hardMode);
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');
  const [isHighContrastMode, setIsHighContrastMode] = useState(highContrast);
  const { showAlert } = useAlert();

  // Show welcome modal
  useEffect(() => {
    if (!boardState.solutionIndex)
      setTimeout(() => setIsInfoModalOpen(true), 1000);
    // eslint-disable-next-line
  }, []);

  // Save board state for the active mode to localStorage
  useEffect(() => {
    if (isUnlimitedMode) {
      setUnlimitedBoardState({
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
  }, [guesses]);

  // Check game winning or losing
  useEffect(() => {
    if (guesses.includes(solution.toUpperCase())) {
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
  }, [guesses, solution]);

  useEffect(() => {
    if (isDarkMode) document.body.setAttribute('data-theme', 'dark');
    else document.body.removeAttribute('data-theme');

    if (isHighContrastMode)
      document.body.setAttribute('data-mode', 'high-contrast');
    else document.body.removeAttribute('data-mode');
  }, [isDarkMode, isHighContrastMode]);

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

  const restoreBoardForMode = mode => {
    let restoredGuesses = [];
    let restoredSolution = dailySolution;

    if (mode === 'unlimited') {
      restoredSolution = unlimitedBoardState.solution || getRandomWord();
      setUnlimitedSolution(restoredSolution);
      if (unlimitedBoardState.solution === restoredSolution)
        restoredGuesses = unlimitedBoardState.guesses;
    } else if (boardState.solutionIndex === solutionIndex) {
      restoredGuesses = boardState.guesses;
    }

    setCurrentGuess('');
    setIsGameWon(restoredGuesses.includes(restoredSolution.toUpperCase()));
    setIsGameLost(
      restoredGuesses.length === MAX_CHALLENGES &&
        !restoredGuesses.includes(restoredSolution.toUpperCase())
    );
    setGuesses(restoredGuesses);
  };

  const handleGameMode = () => {
    const nextMode = isUnlimitedMode ? 'daily' : 'unlimited';
    setGameMode(nextMode);
    restoreBoardForMode(nextMode);
  };

  const handleNewGame = () => {
    if (!isUnlimitedMode) return;
    const newWord = getRandomWord();
    setUnlimitedSolution(newWord);
    setUnlimitedBoardState({ guesses: [], solution: newWord });
    setCurrentGuess('');
    setIsGameWon(false);
    setIsGameLost(false);
    setIsStatsModalOpen(false);
    setGuesses([]);
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
        setIsInfoModalOpen={setIsInfoModalOpen}
        setIsStatsModalOpen={setIsStatsModalOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        isUnlimitedMode={isUnlimitedMode}
      />
      <Alert />
      <Grid
        currentGuess={currentGuess}
        guesses={guesses}
        isJiggling={isJiggling}
        setIsJiggling={setIsJiggling}
        solution={solution}
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
        guesses={guesses}
        showAlert={showAlert}
        isUnlimitedMode={isUnlimitedMode}
        solution={solution}
        onNewGame={handleNewGame}
      />
    </div>
  );
}

export default App;
