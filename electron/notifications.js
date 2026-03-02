/**
 * PeopleSafe SDLC Journal — Daily Journaling Reminder
 * Simple interval check: at 5 PM local time, show an OS notification.
 */

const { Notification } = require('electron');

let intervalId = null;
let remindedToday = null; // date string of last reminder
let mainWindowRef = null;

const REMINDER_HOUR = 17; // 5 PM
const CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

function shouldRemind() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Already reminded today
  if (remindedToday === todayStr) return false;

  // Check if it's past the reminder hour
  return now.getHours() >= REMINDER_HOUR;
}

function showReminder() {
  const now = new Date();
  remindedToday = now.toISOString().slice(0, 10);

  if (!Notification.isSupported()) return;

  const notification = new Notification({
    title: 'Time to Journal',
    body: 'Take a moment to reflect on your day. What went well?',
    silent: false
  });

  notification.on('click', () => {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.show();
      mainWindowRef.focus();
      mainWindowRef.webContents.send('notification:click');
    }
  });

  notification.show();
}

function check() {
  if (shouldRemind()) {
    showReminder();
  }
}

function start(mainWindow) {
  mainWindowRef = mainWindow;
  // Check shortly after startup, then every 15 minutes
  setTimeout(check, 10 * 1000);
  intervalId = setInterval(check, CHECK_INTERVAL);
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = { start, stop };
