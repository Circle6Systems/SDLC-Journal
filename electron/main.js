/**
 * PeopleSafe SDLC Journal — Electron Main Process
 */

const { app, BrowserWindow, protocol, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Modules loaded after app is ready
let tray, menu, notifications, updater;

// Single window reference
let mainWindow = null;

// Window state persistence
const stateFile = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return { width: 960, height: 720 };
  }
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const bounds = mainWindow.getBounds();
  const isMaximized = mainWindow.isMaximized();
  fs.writeFileSync(stateFile, JSON.stringify({ ...bounds, isMaximized }));
}

// Resolve the path to the web app files
function getAppBasePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app');
  }
  // In development, web app files are in the parent directory
  return path.join(__dirname, '..');
}

// Register the app:// custom protocol for secure context
function registerProtocol() {
  protocol.registerFileProtocol('app', (request, callback) => {
    // Strip protocol and host: app://./path → /path
    let urlPath = request.url.replace('app://./', '').replace('app://.', '');

    // Decode URI components
    urlPath = decodeURIComponent(urlPath);

    // Remove query string and hash
    urlPath = urlPath.split('?')[0].split('#')[0];

    // Default to index.html
    if (!urlPath || urlPath === '/') {
      urlPath = 'index.html';
    }

    const filePath = path.join(getAppBasePath(), urlPath);

    // Security: ensure resolved path is within the app base
    const resolved = path.resolve(filePath);
    const base = path.resolve(getAppBasePath());
    if (!resolved.startsWith(base)) {
      callback({ statusCode: 403 });
      return;
    }

    callback({ path: resolved });
  });
}

function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 480,
    minHeight: 600,
    backgroundColor: '#2d2a2e',
    title: 'PeopleSafe SDLC Journal',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (state.isMaximized) {
    mainWindow.maximize();
  }

  // Load the app via custom protocol
  mainWindow.loadURL('app://./index.html');

  // Show window once content is ready (avoids flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Save window state on resize/move
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('close', saveWindowState);

  // Notify renderer of focus/blur for auto-lock
  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:blur');
    }
  });
  mainWindow.on('focus', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:focus');
    }
  });

  // Prevent navigation away from app://
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Handle target="_blank" and window.open()
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

// --- IPC Handlers ---

function setupIPC() {
  // File dialogs
  ipcMain.handle('dialog:save', async (_event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: options.defaultPath || 'backup.json',
      filters: options.filters || [{ name: 'JSON Files', extensions: ['json'] }]
    });
    return result;
  });

  ipcMain.handle('dialog:open', async (_event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: options.filters || [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    });
    return result;
  });

  // File I/O
  ipcMain.handle('file:save', async (_event, filePath, data) => {
    await fs.promises.writeFile(filePath, data, 'utf8');
    return true;
  });

  ipcMain.handle('file:read', async (_event, filePath) => {
    return fs.promises.readFile(filePath, 'utf8');
  });

  // Shell
  ipcMain.handle('shell:openExternal', (_event, url) => {
    return shell.openExternal(url);
  });

  // App lifecycle
  ipcMain.on('app:lock', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:lock');
    }
  });

  ipcMain.on('app:navigate', (_event, view) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:navigate', view);
    }
  });

  ipcMain.on('app:save', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:save');
    }
  });

  ipcMain.on('app:export', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:export');
    }
  });
}

// --- App Lifecycle ---

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Register protocol scheme before app is ready
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: false
      }
    }
  ]);

  app.whenReady().then(() => {
    registerProtocol();
    setupIPC();
    createWindow();

    // Load optional modules
    tray = require('./tray');
    tray.create(mainWindow);

    menu = require('./menu');
    menu.create(mainWindow);

    notifications = require('./notifications');
    notifications.start(mainWindow);

    updater = require('./updater');
    updater.check();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow) {
        mainWindow.show();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    if (notifications) notifications.stop();
  });
}
