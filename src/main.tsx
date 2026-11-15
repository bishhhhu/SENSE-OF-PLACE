import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// After a redeploy, a page that was already open (or a cached index.html) may
// ask for script files that no longer exist (404). Reload once to pick up the
// new build instead of failing.
const RELOAD_KEY = 'jaali-chunk-reload';
function recoverFromStaleBuild() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 30000) return false; // avoid reload loops
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* storage unavailable: still try once */
  }
  window.location.reload();
  return true;
}
window.addEventListener('vite:preloadError', (e) => {
  if (recoverFromStaleBuild()) e.preventDefault();
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = String((e.reason as Error)?.message ?? e.reason ?? '');
  if (/dynamically imported module|Importing a module script failed|Failed to fetch/i.test(msg)) recoverFromStaleBuild();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
