# React Wordle

Wordle game clone created using React, SASS

![Wordle Game Clone Screen Capture](public/Screenshot.png)

### Game Modes

- **Daily** (default): one word per day, shared by all players. Wins and losses update your streaks and guess distribution, and the share text includes the day number.
- **Unlimited**: practice with random words on demand. Toggle it in Settings ("Unlimited Mode"). After finishing a game, use the "New Game" button to get a new random word. Unlimited games track a separate practice stats bucket and never touch your daily stats, streaks, or in-progress daily board — switching back to Daily restores your daily board exactly. Share text for Unlimited games shows "Unlimited" instead of a day number.

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
