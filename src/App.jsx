import { useState, useEffect, useMemo } from 'react';
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
  GAME_MODES,
  MAX_CHALLENGES,
  MAX_WORD_LENGTH,
} from 'constants/settings';
import styles from './App.module.scss';
import 'styles/_transitionStyles.scss';

const initialStats = () => ({
  winDistribution: Array.from(new Array(MAX_CHALLENGES), () => 0),
  gamesFailed: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalGames: 0,
  successRate: 0,
});

function App() {
  const dailyWord = useMemo(() => getWordOfDay(), []);
  const [gameMode, setGameMode] = useLocalStorage('gameMode', GAME_MODES.DAILY);
  const [boardState, setBoardState] = useLocalStorage('boardState', {
    guesses: [],
    solutionIndex: '',
  });
  const [unlimitedBoardState, setUnlimitedBoardState] = useLocalStorage(
    'unlimitedBoardState',
    { guesses: [], solution: '' }
  );
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  const [highContrast, setHighContrast] = useLocalStorage(
    'high-contrast',
    false
  );
  const [hardMode, setHardMode] = useLocalStorage('hard-mode', false);
  const [stats, setStats] = useLocalStorage('gameStats', initialStats());
  const [practiceStats, setPracticeStats] = useLocalStorage(
    'practiceStats',
    initialStats()
  );
  const isUnlimited = gameMode === GAME_MODES.UNLIMITED;
  const [currentGuess, setCurrentGuess] = useState('');
  const [game, setGame] = useState(() =>
    gameMode === GAME_MODES.UNLIMITED
      ? restoreUnlimitedGame(unlimitedBoardState)
      : restoreDailyGame(boardState, dailyWord)
  );
  const { solution, solutionIndex, guesses } = game;
  const [isJiggling, setIsJiggling] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHardMode, setIsHardMode] = useState(hardMode);
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');
  const [isHighContrastMode, setIsHighContrastMode] = useState(highContrast);
  const { showAlert } = useAlert();

  const isGameWon = guesses.includes(solution.toUpperCase());
  const isGameLost = !isGameWon && guesses.length === MAX_CHALLENGES;

  // Show welcome modal
  useEffect(() => {
    if (!boardState.solutionIndex)
      setTimeout(() => setIsInfoModalOpen(true), 1000);
    // eslint-disable-next-line
  }, []);

  // Save the board of the active mode to localStorage
  useEffect(() => {
    if (isUnlimited) setUnlimitedBoardState({ guesses, solution });
    else setBoardState({ guesses, solutionIndex });
    // eslint-disable-next-line
  }, [guesses, gameMode]);

  // Announce a finished game
  useEffect(() => {
    if (!isGameWon && !isGameLost) return;

    if (isGameWon)
      setTimeout(() => showAlert('Well done', 'success'), ALERT_DELAY);
    else
      setTimeout(
        () => showAlert(`The word was ${solution}`, 'error', true),
        ALERT_DELAY
      );

    setTimeout(() => setIsStatsModalOpen(true), ALERT_DELAY + 1000);
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
    const nextMode = isUnlimited ? GAME_MODES.DAILY : GAME_MODES.UNLIMITED;

    setGameMode(nextMode);
    setCurrentGuess('');
    setIsStatsModalOpen(false);
    setGame(
      nextMode === GAME_MODES.UNLIMITED
        ? restoreUnlimitedGame(unlimitedBoardState)
        : restoreDailyGame(boardState, dailyWord)
    );
  };

  const handleNewGame = () => {
    setCurrentGuess('');
    setIsStatsModalOpen(false);
    setGame({ ...getRandomWord(), guesses: [] });
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

    const setModeStats = isUnlimited ? setPracticeStats : setStats;
    const modeStats = isUnlimited ? practiceStats : stats;

    if (currentGuess === solution.toUpperCase()) {
      setModeStats(addStatsForCompletedGame(modeStats, guesses.length));
    } else if (guesses.length + 1 === MAX_CHALLENGES) {
      setModeStats(addStatsForCompletedGame(modeStats, guesses.length + 1));
    }

    setGame({ ...game, guesses: [...guesses, currentGuess] });
    setCurrentGuess('');
  };

  return (
    <div className={styles.container}>
      <Header
        isUnlimited={isUnlimited}
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
        isUnlimited={isUnlimited}
        setIsHardMode={handleHardMode}
        setIsDarkMode={handleDarkMode}
        setIsHighContrastMode={handleHighContrastMode}
        setIsUnlimited={handleUnlimitedMode}
      />
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        gameStats={isUnlimited ? practiceStats : stats}
        numberOfGuessesMade={guesses.length}
        isGameWon={isGameWon}
        isGameLost={isGameLost}
        isHardMode={isHardMode}
        isUnlimited={isUnlimited}
        onNewGame={handleNewGame}
        guesses={guesses}
        solution={solution}
        solutionIndex={solutionIndex}
        tomorrow={dailyWord.tomorrow}
        showAlert={showAlert}
      />
    </div>
  );
}

const restoreDailyGame = (boardState, dailyWord) => ({
  solution: dailyWord.solution,
  solutionIndex: dailyWord.solutionIndex,
  guesses:
    boardState.solutionIndex === dailyWord.solutionIndex
      ? boardState.guesses
      : [],
});

const restoreUnlimitedGame = ({ solution, guesses }) =>
  solution ? { solution, guesses } : { ...getRandomWord(), guesses: [] };

export default App;
