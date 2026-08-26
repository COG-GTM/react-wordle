import {
  getRandomWord,
  getGuessStatuses,
  shareStatus,
  solution,
  solutionIndex,
} from 'lib/words';
import { WORDS } from 'constants/wordList';

describe('getRandomWord', () => {
  it('returns a word from the solutions list', () => {
    for (let i = 0; i < 20; i++) {
      expect(WORDS).toContain(getRandomWord());
    }
  });

  it('returns different words over many draws', () => {
    const draws = new Set(Array.from({ length: 100 }, () => getRandomWord()));
    expect(draws.size).toBeGreaterThan(1);
  });
});

describe('getGuessStatuses', () => {
  it('evaluates a guess against the provided solution', () => {
    expect(getGuessStatuses('CIGAR', 'cigar')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  it('uses the runtime solution, not the daily solution', () => {
    const other = WORDS.find(w => w !== solution);
    expect(getGuessStatuses(other, other)).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });
});

describe('shareStatus', () => {
  const writeText = jest.fn();

  beforeEach(() => {
    writeText.mockClear();
    Object.assign(navigator, { clipboard: { writeText } });
  });

  it('includes the day index in daily mode', () => {
    shareStatus(['CIGAR'], false, false, 'cigar', false);
    expect(writeText.mock.calls[0][0]).toContain(`#${solutionIndex}`);
  });

  it('omits the day index in unlimited mode', () => {
    shareStatus(['CIGAR'], false, false, 'cigar', true);
    const text = writeText.mock.calls[0][0];
    expect(text).not.toContain(`#${solutionIndex}`);
    expect(text).toContain('Unlimited');
  });
});
