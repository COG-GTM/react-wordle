import React from 'react';
import { createRoot } from 'react-dom/client';
import { AlertProvider } from 'context/AlertContext';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AlertProvider>
      <App />
    </AlertProvider>
  </React.StrictMode>,
);

reportWebVitals();
