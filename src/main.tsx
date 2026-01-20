/**
 * AstroWound-MEASURE Application Entry Point
 * Bonne Santé Medicals - bonnesantemedicals.com
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      
      console.log('[App] Service Worker registered successfully:', registration.scope);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('[App] New version available');
              if (confirm('A new version is available. Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });
      
      // Request persistent storage for offline data
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        console.log('[App] Persistent storage:', isPersisted ? 'granted' : 'not granted');
      }
      
    } catch (error) {
      console.error('[App] ServiceWorker registration failed:', error);
    }
  });
}

// Listen for online/offline events
window.addEventListener('online', () => {
  console.log('[App] Online');
  document.dispatchEvent(new CustomEvent('app:online'));
});

window.addEventListener('offline', () => {
  console.log('[App] Offline');
  document.dispatchEvent(new CustomEvent('app:offline'));
});

// Handle beforeinstallprompt for PWA install
let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  console.log('[App] Install prompt ready');
  document.dispatchEvent(new CustomEvent('app:installready'));
});

// Export for install button usage
(window as unknown as { installApp: () => Promise<boolean> }).installApp = async () => {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
};

window.addEventListener('appinstalled', () => {
  console.log('[App] App installed successfully');
  deferredPrompt = null;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
