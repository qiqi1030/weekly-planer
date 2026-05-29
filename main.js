const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// ---- Persistence paths -------------------------------------------------
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return { alwaysOnTop: true, autoLaunch: false, x: undefined, y: undefined };
}

function saveConfig(cfg) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (e) { /* ignore */ }
}

// ---- App state ---------------------------------------------------------
let mainWindow = null;
let tray = null;
let config = loadConfig();
let isQuitting = false;

// ---- Create tray icon --------------------------------------------------
function createTrayIcon() {
  const size = 22;
  const canvas = nativeImage.createFromBuffer(
    Buffer.from(
      (() => {
        const buf = Buffer.alloc(size * size * 4);
        const purple = [108, 99, 255, 255];
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const off = (y * size + x) * 4;
            const cx = size / 2, cy = size / 2, r = size / 2 - 2;
            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= r) {
              buf[off] = purple[0]; buf[off + 1] = purple[1];
              buf[off + 2] = purple[2]; buf[off + 3] = purple[3];
            }
          }
        }
        return buf;
      })()
    ),
    { width: size, height: size }
  );

  tray = new Tray(canvas);
  tray.setToolTip('Weekly Planner');
  updateTrayMenu();
}

function updateTrayMenu() {
  const ctxMenu = Menu.buildFromTemplate([
    {
      label: '📋 显示/隐藏',
      click: () => toggleWindow()
    },
    { type: 'separator' },
    {
      label: config.alwaysOnTop ? '📌 取消置顶' : '📌 置顶显示',
      click: () => {
        config.alwaysOnTop = !config.alwaysOnTop;
        if (mainWindow) mainWindow.setAlwaysOnTop(config.alwaysOnTop);
        saveConfig(config);
        updateTrayMenu();
        if (mainWindow) mainWindow.webContents.send('pin-changed', config.alwaysOnTop);
      }
    },
    {
      label: config.autoLaunch ? '✅ 开机自启' : '⬜ 开机自启',
      click: () => {
        config.autoLaunch = !config.autoLaunch;
        app.setLoginItemSettings({
          openAtLogin: config.autoLaunch,
          path: process.execPath,
          args: []
        });
        saveConfig(config);
        updateTrayMenu();
        if (mainWindow) mainWindow.webContents.send('autolaunch-changed', config.autoLaunch);
      }
    },
    { type: 'separator' },
    {
      label: '🔄 刷新',
      click: () => { if (mainWindow) mainWindow.reload(); }
    },
    {
      label: '❌ 退出',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(ctxMenu);
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

// ---- Create window -----------------------------------------------------
function createWindow() {
  const display = screen.getPrimaryDisplay();
  const { width: sw, height: sh } = display.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 440,
    height: 700,
    x: config.x !== undefined ? config.x : sw - 480,
    y: config.y !== undefined ? config.y : 60,
    frame: false,
    transparent: false,
    resizable: true,
    minimizable: true,
    maximizable: false,
    alwaysOnTop: config.alwaysOnTop,
    skipTaskbar: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  mainWindow.loadFile('weekly-planner.html');

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Save position on move
  let saveTimer = null;
  mainWindow.on('move', () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const [x, y] = mainWindow.getPosition();
      config.x = x;
      config.y = y;
      saveConfig(config);
    }, 300);
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Tray click toggles window
  tray.on('click', () => toggleWindow());
  tray.on('double-click', () => toggleWindow());
}

// ---- IPC handlers ------------------------------------------------------
ipcMain.handle('get-config', () => config);
ipcMain.handle('minimize-window', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.handle('close-window', () => { if (mainWindow) mainWindow.hide(); });
ipcMain.handle('toggle-pin', () => {
  config.alwaysOnTop = !config.alwaysOnTop;
  if (mainWindow) mainWindow.setAlwaysOnTop(config.alwaysOnTop);
  saveConfig(config);
  updateTrayMenu();
  return config.alwaysOnTop;
});
ipcMain.handle('get-platform', () => process.platform);

// ---- App lifecycle -----------------------------------------------------
app.whenReady().then(() => {
  createTrayIcon();
  createWindow();

  app.on('activate', () => {
    if (mainWindow) mainWindow.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
});
