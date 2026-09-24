import { render, screen, fireEvent } from '@testing-library/react';
import StatsModal from './StatsModal';
import { shareStatus } from 'lib/words';

jest.mock('lib/words', () => ({
  shareStatus: jest.fn(),
  tomorrow: new Date(2022, 0, 2).valueOf(),
}));

const gameStats = {
  winDistribution: [1, 0, 3, 0, 0, 0],
  gamesFailed: 1,
  currentStreak: 2,
  bestStreak: 5,
  totalGames: 5,
  successRate: 80,
};

const renderStatsModal = (props = {}) => {
  const onClose = jest.fn();
  const showAlert = jest.fn();
  const view = render(
    <StatsModal
      isOpen
      onClose={onClose}
      gameStats={gameStats}
      numberOfGuessesMade={3}
      isGameWon={false}
      isGameLost={false}
      isHardMode={false}
      guesses={['REACT']}
      showAlert={showAlert}
      {...props}
    />
  );

  return { ...view, onClose, showAlert };
};

afterEach(() => {
  jest.clearAllMocks();
});

it('shows the played stats', () => {
  renderStatsModal();

  expect(screen.getByText('Played').previousSibling).toHaveTextContent('5');
  expect(screen.getByText('Win Rate %').previousSibling).toHaveTextContent(
    '80'
  );
  expect(screen.getByText('Current Streak').previousSibling).toHaveTextContent(
    '2'
  );
  expect(screen.getByText('Best Streak').previousSibling).toHaveTextContent(
    '5'
  );
});

it('renders one progress bar per allowed guess and highlights the current row', () => {
  const { container } = renderStatsModal();

  expect(container.querySelectorAll('.progress')).toHaveLength(
    gameStats.winDistribution.length
  );
  expect(container.querySelectorAll('.blue')).toHaveLength(1);
  expect(container.querySelector('.blue')).toHaveTextContent('3');
});

it('hides the countdown and share button while the game is running', () => {
  renderStatsModal();

  expect(screen.queryByText('Share')).not.toBeInTheDocument();
  expect(screen.queryByText('Next word in')).not.toBeInTheDocument();
});

it('shares the result once the game is over', () => {
  const { showAlert } = renderStatsModal({ isGameWon: true, isHardMode: true });

  expect(screen.getByText('Next word in')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Share'));

  expect(shareStatus).toHaveBeenCalledWith(['REACT'], false, true);
  expect(showAlert).toHaveBeenCalledWith('Game copied to clipboard', 'success');
});

it('offers sharing for a lost game too', () => {
  renderStatsModal({ isGameLost: true });

  fireEvent.click(screen.getByText('Share'));

  expect(shareStatus).toHaveBeenCalledWith(['REACT'], true, false);
});
