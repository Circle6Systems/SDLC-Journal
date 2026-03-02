/**
 * PeopleSafe SDLC Journal — Native Menu Bar
 */

const { Menu, app, shell } = require('electron');

function create(mainWindow) {
  const isMac = process.platform === 'darwin';

  const template = [
    // macOS app menu
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Save Entry',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('app:save')
        },
        {
          label: 'Lock Journal',
          accelerator: 'CmdOrCtrl+L',
          click: () => mainWindow.webContents.send('app:lock')
        },
        {
          label: 'Export Backup',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow.webContents.send('app:export')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },

    // Edit menu (needed for text editing shortcuts)
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [])
      ]
    },

    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'About SDLC Journaling',
          click: () => mainWindow.webContents.send('app:navigate', 'about')
        },
        {
          label: 'Visit Circle 6 Systems',
          click: () => shell.openExternal('https://circle6systems.com')
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            const updater = require('./updater');
            updater.checkManual(mainWindow);
          }
        }
      ]
    }
  ];

  const menuBar = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menuBar);
}

module.exports = { create };
