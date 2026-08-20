# Test Plan: Unlimited/Practice Mode (PR #66)

App at http://localhost:3000. Clear localStorage first. Record browser.

## 1. Daily mode default
- Header shows "WORDLE" with NO "Unlimited" subtitle.
- Make 1-2 guesses (e.g. CRANE, SLOTH). Verify localStorage: `boardState.guesses` contains them; `gameMode` absent or "daily".

## 2. Toggle to Unlimited
- Gear → Settings modal top row "Unlimited Mode" with desc "Practice with random words without affecting your daily stats". Toggle ON.
- Pass: header shows "Unlimited" subtitle; board clears (empty); localStorage `gameMode`="unlimited"; `unlimitedState.solution` set to a random word.

## 3. Board switching preserves per-mode boards
- Enter one unlimited guess (a wrong word). Toggle back to daily: daily guesses (CRANE, SLOTH) reappear with correct colors. Toggle to unlimited: the unlimited guess reappears.

## 4. Win unlimited game → New Game
- Read `unlimitedState.solution` from devtools/localStorage, type it, win.
- Pass: Stats modal shows "New Game" button, NOT "Next word in" countdown; `practiceStats.totalGames`=1 while `gameStats.totalGames`=0.
- Test Share here (step 5) before New Game: click Share; clipboard text starts "Wordle Game\nUnlimited" (no #number).
- Click New Game: modal closes, board empty, `unlimitedState.solution` changed to a new word.

## 5. Reload persistence
- Make a guess in the new unlimited game, reload page. Pass: still Unlimited subtitle, same guess on board, same solution in `unlimitedState`.

## 6. Daily stats untouched (final check)
- Toggle back to daily: original daily board restored; Stats modal (daily) shows totalGames=0 and countdown behavior unchanged.
