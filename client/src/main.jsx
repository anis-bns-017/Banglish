import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import React from 'react'
import global from 'global';
import App from './App.jsx'
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

window.global = window;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for PWA
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Show update notification
    if (window.showUpdateNotification) {
      window.showUpdateNotification();
    }
  }
});

// Handle install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  
  // Show install button if not installed
  if (window.showInstallPrompt) {
    window.showInstallPrompt();
  }
});

// Track installation
window.addEventListener('appinstalled', () => {
  console.log('PWA installed');
  window.deferredPrompt = null;
});