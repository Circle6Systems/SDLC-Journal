/**
 * PeopleSafe SDLC Journal — Electron Preload Script
 * Exposes a safe API to the renderer via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:save', options),
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:open', options),

  // File I/O
  saveFile: (filePath, data) => ipcRenderer.invoke('file:save', filePath, data),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // App events from main process → renderer
  onLock: (callback) => ipcRenderer.on('app:lock', callback),
  onNavigate: (callback) => ipcRenderer.on('app:navigate', (_event, view) => callback(view)),
  onSave: (callback) => ipcRenderer.on('app:save', callback),
  onExport: (callback) => ipcRenderer.on('app:export', callback),
  onWindowBlur: (callback) => ipcRenderer.on('window:blur', callback),
  onWindowFocus: (callback) => ipcRenderer.on('window:focus', callback),
  onUpdateAvailable: (callback) => ipcRenderer.on('update:available', (_event, info) => callback(info)),
  onNotificationClick: (callback) => ipcRenderer.on('notification:click', callback),

  // Platform info
  platform: process.platform
});

// Inject the electron-bridge.js into the renderer after DOM is ready.
// This wires up IPC events to the Alpine.js app methods.
// We read the file and inject inline since the electron/ dir isn't served by app://.
const fs = require('fs');
const path = require('path');

window.addEventListener('DOMContentLoaded', () => {
  try {
    const bridgePath = path.join(__dirname, 'electron-bridge.js');
    const bridgeCode = fs.readFileSync(bridgePath, 'utf8');
    const script = document.createElement('script');
    script.textContent = bridgeCode;
    document.body.appendChild(script);
  } catch (e) {
    console.error('Failed to load electron-bridge.js:', e);
  }
});
