# React Wordle

Wordle game clone created using React, SASS

![Wordle Game Clone Screen Capture](public/Screenshot.png)

### Game Modes

- **Daily** (default): one word per day, shared by everyone. Wins and losses
  update your streaks and guess distribution, and the share text includes the
  day number.
- **Unlimited**: practice with random words, back to back. Toggle it on with
  the switch in the bottom-right corner of the main page. Unlimited games
  track a separate practice
  stats bucket and never touch your daily stats or streaks; the share text
  shows "Unlimited" instead of a day number, and a "New Game" button lets you
  start a fresh random word after each game. Your in-progress daily board is
  preserved when switching modes.

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
