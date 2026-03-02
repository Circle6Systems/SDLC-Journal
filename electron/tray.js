/**
 * PeopleSafe SDLC Journal — System Tray
 */

const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

let tray = null;

function create(mainWindow) {
  const iconPath = path.join(__dirname, 'icons', 'tray-icon.png');

  // Create a small fallback icon if the tray icon doesn't exist yet
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) throw new Error('empty');
    // Resize for tray (macOS wants 16x16 or 22x22)
    icon = icon.resize({ width: 16, height: 16 });
  } catch {
    // Create a minimal 16x16 placeholder
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('PeopleSafe SDLC Journal');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Journal Today',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('app:navigate', 'dashboard');
      }
    },
    {
      label: 'Lock Journal',
      click: () => {
        mainWindow.webContents.send('app:lock');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Click on tray icon shows window (Windows/Linux)
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.focus();
    } else {
      mainWindow.show();
    }
  });

  return tray;
}

module.exports = { create };
