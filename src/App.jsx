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
  solution,
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
  const [boardState, setBoardState] = useLocalStorage('boardState', {
    guesses: [],
    solutionIndex: '',
  });
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  const [highContrast, setHighContrast] = useLocalStorage(
    'high-contrast',
    false
  );
  const [hardMode, setHardMode] = useLocalStorage('hard-mode', false);
  const [unlimitedMode, setUnlimitedMode] = useLocalStorage(
    'unlimitedMode',
    false
  );
  const [unlimitedBoardState, setUnlimitedBoardState] = useLocalStorage(
    'unlimitedBoardState',
    {
      guesses: [],
      solution: '',
    }
  );
  const [stats, setStats] = useLocalStorage('gameStats', {
    winDistribution: Array.from(new Array(MAX_CHALLENGES), () => 0),
    gamesFailed: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGames: 0,
    successRate: 0,
  });
  const [unlimitedStats, setUnlimitedStats] = useLocalStorage(
    'unlimitedGameStats',
    {
      winDistribution: Array.from(new Array(MAX_CHALLENGES), () => 0),
      gamesFailed: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalGames: 0,
      successRate: 0,
    }
  );
  const [isUnlimitedMode, setIsUnlimitedMode] = useState(unlimitedMode);
  const [unlimitedSolution, setUnlimitedSolution] = useState(
    () => unlimitedBoardState.solution || getRandomWord()
  );
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState(() => {
    if (unlimitedMode) {
      return unlimitedBoardState.solution ? unlimitedBoardState.guesses : [];
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

  const currentSolution = isUnlimitedMode ? unlimitedSolution : solution;

  // Show welcome modal
  useEffect(() => {
    if (!boardState.solutionIndex)
      setTimeout(() => setIsInfoModalOpen(true), 1000);
    // eslint-disable-next-line
  }, []);

  // Save boardState to localStorage
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
    if (guesses.includes(currentSolution.toUpperCase())) {
      setIsGameWon(true);
      setTimeout(() => showAlert('Well done', 'success'), ALERT_DELAY);
      setTimeout(() => setIsStatsModalOpen(true), ALERT_DELAY + 1000);
    } else if (guesses.length === MAX_CHALLENGES) {
      setIsGameLost(true);
      setTimeout(
        () => showAlert(`The word was ${currentSolution}`, 'error', true),
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

  const handleUnlimitedMode = () => {
    const nextIsUnlimited = !isUnlimitedMode;
    setIsUnlimitedMode(nextIsUnlimited);
    setUnlimitedMode(nextIsUnlimited);
    setCurrentGuess('');
    setIsGameWon(false);
    setIsGameLost(false);

    if (nextIsUnlimited) {
      const restored = unlimitedBoardState.solution
        ? unlimitedBoardState
        : { guesses: [], solution: getRandomWord() };
      setUnlimitedSolution(restored.solution);
      setGuesses(restored.guesses);
    } else {
      setGuesses(
        boardState.solutionIndex === solutionIndex ? boardState.guesses : []
      );
    }
  };

  const handlePlayAgain = () => {
    const newWord = getRandomWord(unlimitedSolution);
    setUnlimitedSolution(newWord);
    setGuesses([]);
    setCurrentGuess('');
    setIsGameWon(false);
    setIsGameLost(false);
    setIsStatsModalOpen(false);
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
        currentSolution
      );
      if (firstMissingReveal) {
        setIsJiggling(true);
        return showAlert(firstMissingReveal, 'error');
      }
    }

    if (currentGuess === currentSolution.toUpperCase()) {
      if (isUnlimitedMode) {
        setUnlimitedStats(
          addStatsForCompletedGame(unlimitedStats, guesses.length)
        );
      } else {
        setStats(addStatsForCompletedGame(stats, guesses.length));
      }
    } else if (guesses.length + 1 === MAX_CHALLENGES) {
      if (isUnlimitedMode) {
        setUnlimitedStats(
          addStatsForCompletedGame(unlimitedStats, guesses.length + 1)
        );
      } else {
        setStats(addStatsForCompletedGame(stats, guesses.length + 1));
      }
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
        solution={currentSolution}
        isJiggling={isJiggling}
        setIsJiggling={setIsJiggling}
      />
      <Keyboard
        onEnter={handleEnter}
        onDelete={handleDelete}
        onKeyDown={handleKeyDown}
        guesses={guesses}
        solution={currentSolution}
      />
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
      <SettingModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isUnlimitedMode={isUnlimitedMode}
        isHardMode={isHardMode}
        isDarkMode={isDarkMode}
        isHighContrastMode={isHighContrastMode}
        setIsUnlimitedMode={handleUnlimitedMode}
        setIsHardMode={handleHardMode}
        setIsDarkMode={handleDarkMode}
        setIsHighContrastMode={handleHighContrastMode}
      />
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        gameStats={isUnlimitedMode ? unlimitedStats : stats}
        numberOfGuessesMade={guesses.length}
        isGameWon={isGameWon}
        isGameLost={isGameLost}
        isHardMode={isHardMode}
        isUnlimitedMode={isUnlimitedMode}
        guesses={guesses}
        solution={currentSolution}
        onPlayAgain={handlePlayAgain}
        showAlert={showAlert}
      />
    </div>
  );
}

export default App;
