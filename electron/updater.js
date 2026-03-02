/**
 * PeopleSafe SDLC Journal — Auto-Updater
 * Uses electron-updater to check for updates via GitHub Releases.
 */

const { dialog, app } = require('electron');

let autoUpdater;

function init() {
  if (autoUpdater) return;
  try {
    autoUpdater = require('electron-updater').autoUpdater;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
  } catch (e) {
    console.log('electron-updater not available:', e.message);
  }
}

function check() {
  init();
  if (!autoUpdater) return;

  // Delay the check to avoid slowing startup
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {
      // Silent fail on startup check
    });
  }, 10 * 1000);

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available.`,
      detail: 'Would you like to download the update now?',
      buttons: ['Download', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'The update has been downloaded.',
      detail: 'Restart now to install the update, or it will be installed when you quit.',
      buttons: ['Restart Now', 'Install on Quit'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', () => {
    // Silent fail for automatic checks
  });
}

function checkManual(mainWindow) {
  init();
  if (!autoUpdater) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Updates',
      message: 'Auto-update is not available in development mode.'
    });
    return;
  }

  autoUpdater.checkForUpdates().then((result) => {
    if (!result || !result.updateInfo) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'No Updates',
        message: `You're running the latest version (${app.getVersion()}).`
      });
    }
  }).catch(() => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'No Updates',
      message: `You're running the latest version (${app.getVersion()}).`
    });
  });
}

module.exports = { check, checkManual };
