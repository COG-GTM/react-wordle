# React Wordle

Wordle game clone created using React, SASS

![Wordle Game Clone Screen Capture](public/Screenshot.png)

### Game Modes

- **Daily** (default): one word per day, shared by everyone. Wins and losses
  count toward your streaks and guess distribution, and shared results include
  the day number.
- **Unlimited**: practice with a random word as many times as you like. Toggle
  it on from the settings modal (gear icon). After a win or loss, use the
  "New Game" button in the statistics modal to start another round. Unlimited
  games track their own practice statistics and never affect your daily stats,
  streaks, or in-progress daily board, and shared results don't include a day
  number.

Your mode choice and the board for each mode are saved locally, so switching
between modes (or reloading) never loses progress.

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
