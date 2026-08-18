# React Wordle

Wordle game clone created using React, SASS

![Wordle Game Clone Screen Capture](public/Screenshot.png)

### Game Modes

**Daily mode** (default): one word per day, shared by all players. Wins and losses update your
statistics (streaks, guess distribution, success rate), and the share text includes the day
number. A countdown to the next word is shown after the game ends.

**Unlimited mode**: practice with random words on demand. Toggle it on via Settings ("Unlimited
Mode"); the header shows an "Unlimited" indicator while active. After a win or loss, a "New Game"
button starts a fresh random word immediately. Unlimited games track a separate practice
statistics bucket and never affect your daily stats or streaks. Share text shows "Unlimited"
instead of a day number, and no countdown timer is displayed.

The selected mode and each mode's in-progress board are persisted, so switching
Daily → Unlimited → Daily (or reloading) never loses progress.

### To Run Locally:

In the project directory, you can run:

```bash
npm install
npm run start
```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### To Build For Production:

```bash
npm run build
```

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!
