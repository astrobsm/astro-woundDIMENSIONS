/**
 * AstroWound-MEASURE Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.log('ServiceWorker registration failed:', error);
    });
  });
}

// Listen for online/offline events
window.addEventListener('online', () => {
  document.dispatchEvent(new CustomEvent('app:online'));
});

window.addEventListener('offline', () => {
  document.dispatchEvent(new CustomEvent('app:offline'));
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
