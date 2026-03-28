---
title: Developer Guide
scope: Coding conventions, file organization, module patterns, Electron development, and how to extend the application
last_updated: 2026-03-27
---

# Developer Guide

## Development Setup

For prerequisites, installation, and running the app locally, see [README.md — Local Development](../README.md#local-development).

## File Organization

The project has no build tooling. All source files are served directly by the static host.

```
index.html                  ← App shell: all HTML views as Alpine.js templates
css/styles.css              ← Single stylesheet, CSS custom properties for theming
js/utils.js                 ← Date helpers, formatters, escaping (loaded first)
js/crypto.js                ← Web Crypto API wrapper (depends on nothing)
js/storage.js               ← IndexedDB abstraction (depends on Utils for export filename)
js/rollups.js               ← Period aggregation (depends on Utils, Storage, Crypto)
js/app.js                   ← Alpine.js component (depends on all above)
js/vendor/alpine.min.js     ← Vendored Alpine.js 3.x (loaded with defer, runs last)
electron/
  main.js                   ← Electron main process: protocol, window, IPC
  preload.js                ← contextBridge: exposes electronAPI to renderer
  electron-bridge.js        ← IPC event listeners → Alpine.js method calls
  tray.js                   ← System tray icon and context menu
  menu.js                   ← Native menu bar with keyboard accelerators
  notifications.js          ← Daily 5 PM journaling reminder
  updater.js                ← Auto-update via GitHub Releases
  package.json              ← Electron deps + electron-builder config
  icons/                    ← Platform-specific app and tray icons
  build/                    ← macOS entitlements plist
```

Scripts are loaded synchronously in `index.html` in this exact order. Alpine.js has the `defer` attribute so it executes after all other scripts have registered the `alpine:init` event listener in `app.js`.

## Module Pattern

Each JavaScript file uses the **IIFE (Immediately Invoked Function Expression)** pattern, exposing a single global namespace object. This was chosen over ES modules to avoid the need for a bundler or `type="module"` script tags.

The pattern for every module is:

```javascript
const ModuleName = (() => {
  'use strict';
  // private functions and state
  function _privateHelper() { ... }
  // public API
  function publicMethod() { ... }
  return { publicMethod };
})();
```

Private functions are prefixed with `_`. The public API is the returned object at the bottom of the IIFE.

The `electron/` modules use **CommonJS** (`require`/`module.exports`) since they run in Node.js. Each module exports an object with its public functions (e.g., `module.exports = { create }` in `tray.js`).

## Coding Conventions

- **No external dependencies** at runtime. The only vendored library is Alpine.js. All other functionality uses browser-native APIs.
- **No build step**. Changes to any `.js`, `.css`, or `.html` file take effect immediately on reload.
- **CSS custom properties** for all colors, spacing, and sizing. Modify `:root` variables in `css/styles.css` to change the theme.
- **Alpine.js directives** (`x-data`, `x-show`, `x-if`, `x-text`, `x-model`, `x-transition`) handle all DOM manipulation. There is no direct DOM manipulation in JavaScript.
- **Async/await** for all asynchronous operations (crypto, IndexedDB, storage estimates).
- **Error handling**: crypto and storage operations are wrapped in try/catch. User-facing errors are set on `this.error`; success messages on `this.message`. Both are cleared on navigation.

## Adding a New View

To add a new view to the application:

1. **Add state value** in `app.js` — extend the `view` comment on line 10 with the new view name.
2. **Add navigation** — add a `<button>` to both the desktop `nav-bar` and mobile `bottom-nav` in `index.html`.
3. **Add view template** — add a `<div x-show="view === 'yourview'" x-transition>` block inside the authenticated section of `index.html`.
4. **Add loader method** — if the view needs data, add an `async _loadYourView()` method in the `navigate()` switch in `app.js`.

## Adding a New SDLC Category

The four categories (success, delight, learning, compliment) are referenced in several places. To add or rename a category:

1. **`js/rollups.js`** — update the `CATEGORIES` array
2. **`js/app.js`** — update `entryForm`, `editForm`, `getCategoryLabel()`, and `getCategoryIcon()`
3. **`index.html`** — update all four `sdlc-field` blocks in the dashboard, browse edit, and rollup views
4. **`css/styles.css`** — add CSS variables (`--newcat-color`, `--newcat-bg`) and class rules (`.sdlc-field.newcat`, `.sdlc-label.newcat`, etc.)

## Security Considerations for Contributors

Any code change must maintain the encryption guarantees documented in [SECURITY.md](SECURITY.md). Key rules:

- Never persist the `CryptoKey` to storage. It must only exist in a JavaScript variable.
- Never log or display plaintext entry content to the console in production.
- All user-generated content must be rendered via `x-text` (which auto-escapes HTML), never `x-html`.
- Do not add external script sources, CDN links, or analytics. The CSP and privacy commitment prohibit external connections.
- New IndexedDB stores or schema changes require incrementing `DB_VERSION` in `storage.js` and adding migration logic in `onupgradeneeded`.
- The `lock()` method must clear **all** decrypted state — if you add new data properties that hold plaintext, add them to the clearing list in `lock()`.
- The import function in `storage.js` protects cryptographic meta keys (`passphraseHash`, `passphraseSalt`, `keySalt`) from overwrite. Never bypass this protection.
- `window.sdlcAppRef` is only set when `window.electronAPI` exists. Do not expose it unconditionally.

## Electron Development

To run the desktop app locally, install Electron dependencies and start. See [README.md — Local Development](../README.md#local-development) for prerequisites and commands.

**Adding an IPC handler** (e.g., a new native dialog or file operation):

1. **Main process** (`electron/main.js`): Add `ipcMain.handle('channel:name', handler)` in `setupIPC()`. For file I/O, follow the dialog-approved path validation pattern — store the dialog-returned path, validate it on the subsequent file operation, then clear it (single-use).
2. **Preload** (`electron/preload.js`): Expose the channel in the `contextBridge.exposeInMainWorld('electronAPI', {...})` object. The preload runs with `sandbox: true` — do not import `fs`, `path`, or other Node.js modules here.
3. **Bridge** (`electron/electron-bridge.js`): If the feature is triggered by menu/tray, add an `electronAPI.onChannelName()` listener that calls the appropriate `window.sdlcAppRef` method. Bridge code is loaded into the renderer via the `bridge:code` IPC channel, not via filesystem access.
4. **Web app**: Gate Electron-specific behavior behind `if (window.electronAPI)` checks so the browser version is unaffected.

**Adding a menu item**: Edit `electron/menu.js` and add an entry to the appropriate submenu template. Use `mainWindow.webContents.send('app:yourEvent')` to send an IPC message to the renderer, then handle it in `electron-bridge.js`.
