export const reactNativeMain = (code, initSettings, imports = '') => `
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from './App';
${imports}

window.React = React;
window.ReactDOM = ReactDOM;
window.ComponentCapture = ${JSON.stringify(initSettings)};

const originalFetch = window.fetch;
function isReactDomVersionCheck(url) {
  if (typeof url !== 'string') return false;
  return (
    (url.includes('jsdelivr.com') && url.includes('react-dom')) ||
    (url.includes('unpkg.com') && url.includes('react-dom'))
  );
}

function setupLoadingBar() {
  if (document.getElementById('progress-bar')) return;
  
  const style = document.createElement('style');
  style.textContent = \`
#progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  width: 0%;
  background: linear-gradient(to right, #7b1fa2, #f48fb1);
  z-index: 999999;
  transition: width 0.3s ease-out;
  visibility: hidden;
}
\`;
  document.head.appendChild(style);
  
  const bar = document.createElement('div');
  bar.id = 'progress-bar';
  document.body.appendChild(bar);
}

// Track if we have any pending requests
let pendingRequests = 0;

// Update loading bar state. The bar tracks the initial load only: once it
// completes (or the failsafe fires) it never reappears — long-lived requests
// (fonts, HMR, streaming) previously left it stuck mid-screen forever.
let loadingBarDone = false;

function finishLoadingBar() {
  if (loadingBarDone) return;
  loadingBarDone = true;
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  bar.style.width = '100%';
  setTimeout(() => {
    bar.style.visibility = 'hidden';
    bar.style.width = '0%';
  }, 300);
}

function updateLoadingBar(isLoading) {
  if (loadingBarDone) return;
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  if (isLoading) {
    bar.style.visibility = 'visible';
    bar.style.width = '70%';
  } else {
    finishLoadingBar();
  }
}

// Failsafe: never leave the bar hanging.
setTimeout(finishLoadingBar, 8000);
window.addEventListener('load', () => {
  setTimeout(() => { if (pendingRequests <= 0) finishLoadingBar(); }, 1500);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLoadingBar);
} else {
  setupLoadingBar();
}

window.fetch = function(url, options) {
  if (isReactDomVersionCheck(url)) {
    const fakeResponse = {
      tags: {
        latest: '18.3.1'
      },
      // unpkg package.json format
      name: 'react-dom',
      version: '18.3.1',
      dependencies: {
        'loose-envify': '^1.1.0',
        'scheduler': '^0.23.0'
      }
    };

    return Promise.resolve(new Response(JSON.stringify(fakeResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }));
  }

  // Start loading animation
  pendingRequests++;
  updateLoadingBar(true);
  
  return originalFetch.apply(this, arguments)
    .finally(() => {
      // Complete loading animation if this is the last request
      pendingRequests--;
      if (pendingRequests === 0) {
        updateLoadingBar(false);
      }
    });
};

const rootElement = document.getElementById('root');
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;