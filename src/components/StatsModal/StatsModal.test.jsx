import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatsModal from './StatsModal';
import { getShareText } from './share';

jest.mock('lib/words', () => {
  const statuses = {
    CRANE: ['absent', 'present', 'absent', 'absent', 'correct'],
    STORE: ['correct', 'correct', 'correct', 'correct', 'correct'],
  };
  return {
    getGuessStatuses: guess => statuses[guess],
    solutionIndex: 123,
    tomorrow: Date.now() + 3600000,
  };
});

const gameStats = {
  winDistribution: [0, 4, 2, 1, 0, 0],
  gamesFailed: 1,
  currentStreak: 2,
  bestStreak: 5,
  totalGames: 8,
  successRate: 88,
};

const renderModal = props =>
  render(
    <StatsModal
      isOpen
      onClose={() => {}}
      gameStats={gameStats}
      numberOfGuessesMade={2}
      isGameWon
      isGameLost={false}
      isHardMode={false}
      isHighContrastMode={false}
      guesses={['CRANE', 'STORE']}
      showAlert={jest.fn()}
      {...props}
    />
  );

describe('getShareText', () => {
  test('builds a spoiler-free emoji grid', () => {
    expect(
      getShareText({
        guesses: ['CRANE', 'STORE'],
        solutionIndex: 123,
        isGameLost: false,
        isHardMode: false,
      })
    ).toBe('Wordle Aurora 123 2/6\n\n⬛🟨⬛⬛🟩\n🟩🟩🟩🟩🟩');
  });

  test('marks losses, hard mode and high contrast', () => {
    expect(
      getShareText({
        guesses: ['CRANE'],
        solutionIndex: 7,
        isGameLost: true,
        isHardMode: true,
        isHighContrastMode: true,
      })
    ).toBe('Wordle Aurora 7 X/6*\n\n⬛🟦⬛⬛🟧');
  });
});

describe('StatsModal', () => {
  test('shows legacy stat values', () => {
    renderModal();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(
      screen.getByText('Current streak').previousSibling
    ).toHaveTextContent('2');
    expect(screen.getByText('Best streak').previousSibling).toHaveTextContent(
      '5'
    );
  });

  test('scales bars to the max value and highlights the current row', () => {
    renderModal();
    expect(screen.getByTestId('distribution-bar-2')).toHaveStyle('width: 100%');
    expect(screen.getByTestId('distribution-bar-3')).toHaveStyle('width: 50%');
    expect(screen.getByTestId('distribution-bar-1')).toHaveStyle('width: 0%');
    expect(screen.getByTestId('distribution-bar-2')).toHaveAttribute(
      'data-current',
      'true'
    );
    expect(screen.getByTestId('distribution-bar-3')).not.toHaveAttribute(
      'data-current'
    );
  });

  test('does not highlight a row when the game was lost', () => {
    renderModal({ isGameWon: false, isGameLost: true, numberOfGuessesMade: 6 });
    expect(
      document.querySelector('[data-current="true"]')
    ).not.toBeInTheDocument();
  });

  test('hides share until the game is finished', () => {
    renderModal({ isGameWon: false, isGameLost: false });
    expect(screen.queryByText('Share')).not.toBeInTheDocument();
  });

  test('share copies the emoji grid and shows an alert', async () => {
    const writeText = jest.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });
    const showAlert = jest.fn();
    renderModal({ showAlert });

    fireEvent.click(screen.getByText('Share'));

    await waitFor(() =>
      expect(showAlert).toHaveBeenCalledWith('Copied to clipboard', 'success')
    );
    expect(writeText).toHaveBeenCalledWith(
      'Wordle Aurora 123 2/6\n\n⬛🟨⬛⬛🟩\n🟩🟩🟩🟩🟩'
    );
  });
});
