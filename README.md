# React Wordle

Wordle game clone created using React, SASS

![Wordle Game Clone Screen Capture](public/Screenshot.png)

### Game Modes

- **Daily mode (default):** one word per day, derived from the date. Your streaks, win distribution, and shareable results (with day number) live here.
- **Unlimited / Practice mode:** play random words back-to-back. Toggle it in Settings ("Unlimited Mode"); the header shows an UNLIMITED badge while active. Practice games use a separate board state and a separate practice stats bucket, so your daily board, streaks, and stats are never affected. After a win/loss you get a "New Game" button instead of the next-word countdown, and shared results omit the day number.

Your mode choice and in-progress boards for both modes persist across reloads via localStorage.

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
