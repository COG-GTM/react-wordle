import { MAX_CHALLENGES } from 'constants/settings';
import { getGuessStatuses } from 'lib/words';

const EMOJI = {
  default: { correct: '🟩', present: '🟨', absent: '⬛' },
  highContrast: { correct: '🟧', present: '🟦', absent: '⬛' },
};

export const getEmojiGrid = (guesses, isHighContrastMode = false) => {
  const emoji = isHighContrastMode ? EMOJI.highContrast : EMOJI.default;

  return guesses
    .map(guess =>
      getGuessStatuses(guess)
        .map(status => emoji[status] || emoji.absent)
        .join('')
    )
    .join('\n');
};

export const getShareText = ({
  guesses,
  solutionIndex,
  isGameLost,
  isHardMode,
  isHighContrastMode,
}) => {
  const score = isGameLost ? 'X' : guesses.length;
  const header = `Wordle Aurora ${solutionIndex} ${score}/${MAX_CHALLENGES}${
    isHardMode ? '*' : ''
  }`;

  return `${header}\n\n${getEmojiGrid(guesses, isHighContrastMode)}`;
};

const legacyCopy = text => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) throw new Error('Copy failed');
};

export const copyToClipboard = async text => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (e) {
      // fall through to the legacy copy path
    }
  }
  legacyCopy(text);
};
