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
  getWordOfDay,
  getRandomWord,
  isWordValid,
  findFirstUnusedReveal,
  addStatsForCompletedGame,
} from 'lib/words';
import {
  ALERT_DELAY,
  MAX_CHALLENGES,
  MAX_WORD_LENGTH,
} from 'constants/settings';
import styles from './App.module.scss';
import 'styles/_transitionStyles.scss';

const EMPTY_STATS = {
  winDistribution: Array.from(new Array(MAX_CHALLENGES), () => 0),
  gamesFailed: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalGames: 0,
  successRate: 0,
};

const { solution: dailySolution, solutionIndex, tomorrow } = getWordOfDay();

function App() {
  const [gameMode, setGameMode] = useLocalStorage('gameMode', 'daily');
  const [boardState, setBoardState] = useLocalStorage('boardState', {
    guesses: [],
    solutionIndex: '',
  });
  const [unlimitedState, setUnlimitedState] = useLocalStorage(
    'unlimitedState',
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
  const [stats, setStats] = useLocalStorage('gameStats', EMPTY_STATS);
  const [practiceStats, setPracticeStats] = useLocalStorage(
    'practiceStats',
    EMPTY_STATS
  );
  const [randomSolution, setRandomSolution] = useState(
    () => unlimitedState.solution || getRandomWord()
  );
  const isUnlimitedMode = gameMode === 'unlimited';
  const solution = isUnlimitedMode ? randomSolution : dailySolution;
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState(() => {
    if (gameMode === 'unlimited') return unlimitedState.guesses;
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
      setUnlimitedState({
        guesses,
        solution: randomSolution,
      });
    } else {
      setBoardState({
        guesses,
        solutionIndex,
      });
    }
    // eslint-disable-next-line
  }, [guesses, randomSolution]);

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
  }, [guesses]);

  useEffect(() => {
    if (isDarkMode) document.body.setAttribute('data-theme', 'dark');
    else document.body.removeAttribute('data-theme');

    if (isHighContrastMode)
      document.body.setAttribute('data-mode', 'high-contrast');
    else document.body.removeAttribute('data-mode');
  }, [isDarkMode, isHighContrastMode]);

  const loadModeBoard = (nextGuesses, nextSolution) => {
    setCurrentGuess('');
    setGuesses(nextGuesses);
    setIsGameWon(nextGuesses.includes(nextSolution.toUpperCase()));
    setIsGameLost(
      nextGuesses.length === MAX_CHALLENGES &&
        !nextGuesses.includes(nextSolution.toUpperCase())
    );
  };

  const handleGameMode = () => {
    if (isUnlimitedMode) {
      setGameMode('daily');
      const dailyGuesses =
        boardState.solutionIndex === solutionIndex ? boardState.guesses : [];
      loadModeBoard(dailyGuesses, dailySolution);
    } else {
      setGameMode('unlimited');
      const nextSolution = unlimitedState.solution || getRandomWord();
      setRandomSolution(nextSolution);
      loadModeBoard(unlimitedState.guesses, nextSolution);
    }
  };

  const handleNewGame = () => {
    const nextSolution = getRandomWord();
    setRandomSolution(nextSolution);
    loadModeBoard([], nextSolution);
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

    const setActiveStats = isUnlimitedMode ? setPracticeStats : setStats;
    const activeStats = isUnlimitedMode ? practiceStats : stats;

    if (currentGuess === solution.toUpperCase()) {
      setActiveStats(addStatsForCompletedGame(activeStats, guesses.length));
    } else if (guesses.length + 1 === MAX_CHALLENGES) {
      setActiveStats(addStatsForCompletedGame(activeStats, guesses.length + 1));
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
        isUnlimitedMode={isUnlimitedMode}
        isHardMode={isHardMode}
        isDarkMode={isDarkMode}
        isHighContrastMode={isHighContrastMode}
        setIsUnlimitedMode={handleGameMode}
        setIsHardMode={handleHardMode}
        setIsDarkMode={handleDarkMode}
        setIsHighContrastMode={handleHighContrastMode}
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
        solutionIndex={isUnlimitedMode ? null : solutionIndex}
        tomorrow={tomorrow}
        onNewGame={handleNewGame}
        showAlert={showAlert}
      />
    </div>
  );
}

export default App;
