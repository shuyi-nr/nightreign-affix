import { StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { prepareIntro } from './lib/intro';

const appReady = prepareIntro();
function IntroReady() {
  useLayoutEffect(() => { appReady(); }, []);
  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <IntroReady />
  </StrictMode>,
);

// Register the service worker for offline / install support (best-effort;
// silently no-ops on http:// and file:// where service workers are unavailable).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
