/**
 * PeopleSafe SDLC Journal — Electron Bridge (Renderer Side)
 * Loaded via <script> tag only in Electron (detected at runtime).
 * Listens for IPC events from main process and calls Alpine.js app methods.
 *
 * This file is loaded by the web app when window.electronAPI is available.
 * It wires up Electron menu/tray/notification events to the Alpine.js component.
 */

(function () {
  'use strict';

  if (!window.electronAPI) return;

  function getApp() {
    return window.sdlcAppRef;
  }

  // Lock journal (from menu or tray)
  window.electronAPI.onLock(() => {
    const app = getApp();
    if (app && app.cryptoKey) app.lock();
  });

  // Navigate to a view (from tray "Journal Today" or menu)
  window.electronAPI.onNavigate((view) => {
    const app = getApp();
    if (app && app.cryptoKey) app.navigate(view);
  });

  // Save current entry (Cmd+S)
  window.electronAPI.onSave(() => {
    const app = getApp();
    if (app && app.cryptoKey && app.view === 'dashboard') {
      app.saveEntry();
    }
  });

  // Export backup (Cmd+E)
  window.electronAPI.onExport(() => {
    const app = getApp();
    if (app && app.cryptoKey) app.exportData();
  });

  // Window blur/focus — complement visibilitychange for auto-lock
  let blurTimer = null;
  window.electronAPI.onWindowBlur(() => {
    const app = getApp();
    if (app && app.cryptoKey) {
      blurTimer = setTimeout(() => {
        app.lock();
      }, 5 * 60 * 1000); // 5 minutes
    }
  });

  window.electronAPI.onWindowFocus(() => {
    if (blurTimer) {
      clearTimeout(blurTimer);
      blurTimer = null;
    }
  });

  // Notification click — show dashboard
  window.electronAPI.onNotificationClick(() => {
    const app = getApp();
    if (app && app.cryptoKey) app.navigate('dashboard');
  });

  // Intercept external link clicks → open in system browser
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      event.preventDefault();
      window.electronAPI.openExternal(href);
    }
  });
})();
