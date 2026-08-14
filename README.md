# React Wordle

Wordle game clone created using React, SASS

![Wordle Game Clone Screen Capture](public/Screenshot.png)

### Game Modes

Toggle **Unlimited Mode** in the settings menu to switch between the two modes:

- **Daily**: one word per day for everyone, board state is restored on reload, finished games show the countdown to the next word and can be shared as an emoji grid. Streaks and guess distribution are tracked in `gameStats`.
- **Unlimited**: a random word every game, "New Game" starts another one right away, with no countdown or sharing. Progress is stored separately (`unlimitedBoardState`), and results go to `practiceStats` so daily streaks stay untouched.

The selected mode is persisted, and an in-progress daily board survives switching modes.

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
