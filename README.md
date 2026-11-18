# React Wordle

Wordle game clone created using React, SASS

![Wordle Game Clone Screen Capture](public/Screenshot.png)

A new word every day, six tries, hard mode, dark/light theme, high-contrast colours, statistics saved in the browser and a shareable emoji result. It is a client-only app: there is no backend, and all progress is kept in `localStorage`.

See [docs/architecture.md](docs/architecture.md) for how the app is put together, with a diagram.

### Project Layout

```
public/            index.html, icons, screenshot
src/
  index.js         mounts <App /> inside <AlertProvider>
  App.jsx          game state and input handling
  components/      Header, Grid, Cell, Keyboard, Alert, Modal, InfoModal,
                   SettingModal, StatsModal, Switch (each with a .module.scss)
  context/         AlertContext
  hooks/           useAlert, useLocalStorage, useOnClickOutside
  lib/words.js     word of the day, scoring, hard-mode check, stats, share text
  constants/       settings, answer list, valid-guess list
  styles/          transition styles
docs/              architecture doc and diagram source
```

Imports are absolute from `src/` (see `jsconfig.json`), e.g. `import Grid from 'components/Grid'`.

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

### Tests and Formatting:

```bash
CI=true npm test   # Jest via react-scripts (single run)
npm run check      # Prettier check of src/
npm run fix        # Prettier write of src/
```

`npm install` also installs a Husky pre-commit hook that runs Prettier on staged files in `src/`.
