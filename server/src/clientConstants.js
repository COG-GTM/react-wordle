import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// The client constants are ES modules living inside a CommonJS-by-default package
// (the CRA app has no "type": "module"), so Node refuses to import them directly.
// They contain nothing but literal exports, which makes evaluating their source as
// an ES module safe and keeps the relay on the same word lists as the client.
const importClientModule = async relativePath => {
  const source = await readFile(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    'utf8'
  );

  return import(`data:text/javascript,${encodeURIComponent(source)}`);
};

const [{ WORDS }, { VALID_GUESSES }, { MAX_CHALLENGES, MAX_WORD_LENGTH }] =
  await Promise.all([
    importClientModule('../../src/constants/wordList.js'),
    importClientModule('../../src/constants/validGuesses.js'),
    importClientModule('../../src/constants/settings.js'),
  ]);

export { WORDS, VALID_GUESSES, MAX_CHALLENGES, MAX_WORD_LENGTH };
