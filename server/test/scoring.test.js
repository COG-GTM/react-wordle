import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isGuessAccepted,
  isSolved,
  pickWord,
  scoreGuess,
} from '../src/scoring.js';

test('scores exact matches as correct', () => {
  assert.deepEqual(scoreGuess('CRANE', 'crane'), [
    'correct',
    'correct',
    'correct',
    'correct',
    'correct',
  ]);
  assert.ok(isSolved(scoreGuess('CRANE', 'crane')));
});

test('handles duplicate letters like the client scorer', () => {
  assert.deepEqual(scoreGuess('geese', 'those'), [
    'absent',
    'absent',
    'absent',
    'correct',
    'correct',
  ]);
  assert.deepEqual(scoreGuess('spoon', 'proxy'), [
    'absent',
    'present',
    'correct',
    'absent',
    'absent',
  ]);
});

test('accepts guesses from either word list and rejects everything else', () => {
  assert.ok(isGuessAccepted('crane'));
  assert.ok(isGuessAccepted('AAHED'));
  assert.equal(isGuessAccepted('zzzzz'), false);
  assert.equal(isGuessAccepted('crank!'), false);
  assert.equal(isGuessAccepted('cran'), false);
  assert.equal(isGuessAccepted(undefined), false);
});

test('picks a word from the answer list', () => {
  assert.equal(pickWord(() => 0).length, 5);
});
