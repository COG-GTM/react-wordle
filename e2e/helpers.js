const fs = require('fs');
const path = require('path');

const WORD_LIST_PATH = path.join(
  __dirname,
  '..',
  'src',
  'constants',
  'wordList.js'
);

const loadWords = () => {
  const source = fs.readFileSync(WORD_LIST_PATH, 'utf8');
  const body = source.slice(source.indexOf('['), source.lastIndexOf(']') + 1);
  return JSON.parse(body.replace(/'/g, '"').replace(/,\s*]/, ']'));
};

// Mirrors getWordOfDay() in src/lib/words.js, evaluated with the browser's clock and timezone.
const getSolution = async page => {
  const index = await page.evaluate(() => {
    const epochMs = new Date(2022, 0).valueOf();
    const msInDay = 86400000;
    return Math.floor((Date.now() - epochMs) / msInDay);
  });
  const words = loadWords();
  return words[index % words.length].toUpperCase();
};

const headerButton = (page, name, index) => {
  const header = page.locator('header');
  return header
    .getByRole('button', { name })
    .or(header.getByRole('button').nth(index))
    .first();
};

const openInfo = page =>
  headerButton(page, /how to play|info|help/i, 0).click();
const openStats = page => headerButton(page, /stat/i, 1).click();
const openSettings = page => headerButton(page, /setting/i, 2).click();

const closeModal = async (page, title) => {
  const heading = page.getByRole('heading', { name: title });
  await page.keyboard.press('Escape');
  if (await heading.isVisible()) {
    const viewport = page.viewportSize();
    await page.mouse.click(2, Math.round(viewport.height / 2));
  }
  await heading.waitFor({ state: 'hidden' });
};

const typeWord = async (page, word) => {
  await page.keyboard.type(word.toUpperCase(), { delay: 30 });
  await page.keyboard.press('Enter');
};

// Locate the dark-mode control by accessible name if present, otherwise as the
// second toggle in the settings modal (Hard Mode, Dark Mode, High Contrast).
const darkModeToggle = async page => {
  const named = page
    .getByRole('switch', { name: /dark/i })
    .or(page.getByRole('checkbox', { name: /dark/i, includeHidden: true }));
  if (await named.count()) return named.first();
  return page
    .getByRole('switch')
    .or(page.getByRole('checkbox', { includeHidden: true }))
    .nth(1);
};

const isToggleOn = async toggle =>
  toggle.evaluate(el =>
    el instanceof HTMLInputElement
      ? el.checked
      : el.getAttribute('aria-checked') === 'true'
  );

const readStorage = (page, key) =>
  page.evaluate(k => JSON.parse(window.localStorage.getItem(k)), key);

// Mark the welcome modal as already seen by persisting an in-progress board for today.
const skipWelcome = async page => {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem('e2e-init')) return;
    window.sessionStorage.setItem('e2e-init', '1');
    const epochMs = new Date(2022, 0).valueOf();
    const solutionIndex = Math.floor((Date.now() - epochMs) / 86400000);
    window.localStorage.setItem(
      'boardState',
      JSON.stringify({ guesses: [], solutionIndex })
    );
  });
};

module.exports = {
  getSolution,
  openInfo,
  openStats,
  openSettings,
  closeModal,
  typeWord,
  darkModeToggle,
  isToggleOn,
  readStorage,
  skipWelcome,
};
