# React Wordle

Wordle game clone created using React, SASS

![Wordle Game Clone Screen Capture](public/Screenshot.png)

### Game Modes

- **Daily mode (default)**: one word per day, derived from the date. Your streaks, win distribution, and shareable results (with the day number) live here.
- **Unlimited mode**: practice with a random word any time. Toggle it on in Settings ("Unlimited Mode"). After a win or loss, use "New Game" to get a new random word. Practice games are tracked in a separate practice stats bucket and never affect your daily stats or streak; share output omits the day number. Your in-progress daily board is preserved while you practice and restored exactly when you switch back.

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
