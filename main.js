// XTyping main process. Developed by Datix AI.
// All data stays on this PC (no cloud). Profiles live in the app data folder.
const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DATA_DIR = path.join(app.getPath('userData'), 'profiles');
const DB_FILE = path.join(DATA_DIR, 'users.json');
const USERNAME_RE = /^[a-z][a-z0-9._]{2,23}$/;

let win = null;
let currentUser = null; // username of the signed-in profile
const failed = {}; // username -> { count, until }

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { version: 1, users: {} };
  }
}

function saveDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  if (fs.existsSync(DB_FILE)) fs.copyFileSync(DB_FILE, DB_FILE + '.bak');
  fs.renameSync(tmp, DB_FILE);
}

function hashSecret(secret, salt) {
  return crypto.scryptSync(secret, salt, 64).toString('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function makeRecoveryCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(12);
  let s = '';
  for (let i = 0; i < 12; i++) {
    s += abc[bytes[i] % abc.length];
    if (i === 3 || i === 7) s += '-';
  }
  return s;
}

function publicUser(username, u) {
  return { username, fullName: u.fullName, color: u.color, created: u.created, lastLogin: u.lastLogin, data: u.data || {} };
}

const COLORS = ['#818cf8', '#34d399', '#f472b6', '#fbbf24', '#60a5fa', '#a78bfa', '#fb7185', '#2dd4bf'];

function createWindow() {
  win = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1060,
    minHeight: 700,
    backgroundColor: '#0b1026',
    title: 'XTyping',
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => win.show());
  // Developer check: XT_SHOT=<file.png> saves a screenshot after start-up, then quits.
  if (!app.isPackaged && process.env.XT_SHOT) {
    win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2) console.log('[renderer]', msg); });
    setTimeout(async () => {
      if (process.env.XT_EVAL) {
        try { console.log('[eval]', await win.webContents.executeJavaScript(fs.readFileSync(process.env.XT_EVAL, 'utf8'))); } catch (e) { console.log('[eval error]', e.message); }
      }
      const img = await win.webContents.capturePage();
      fs.writeFileSync(process.env.XT_SHOT, img.toPNG());
      app.quit();
    }, 3000);
  }
  // Never navigate away from the app; open allowed links in the default browser.
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}

// ---------- IPC ----------
ipcMain.handle('app:info', () => ({ version: app.getVersion(), dataDir: DATA_DIR }));

ipcMain.handle('app:open', (_e, url) => {
  const ok = typeof url === 'string' && /^https:\/\/(www\.)?datixai\.com(\/|$)/.test(url);
  if (ok) shell.openExternal(url);
  return ok;
});

ipcMain.handle('users:list', () => {
  const db = loadDb();
  return Object.entries(db.users)
    .map(([username, u]) => ({ username, fullName: u.fullName, color: u.color, lastLogin: u.lastLogin || 0 }))
    .sort((a, b) => b.lastLogin - a.lastLogin);
});

ipcMain.handle('users:register', (_e, { username, fullName, password }) => {
  username = String(username || '').trim().toLowerCase();
  fullName = String(fullName || '').trim().replace(/\s+/g, ' ');
  password = String(password || '');
  if (!USERNAME_RE.test(username)) return { ok: false, error: 'Username must be 3-24 small letters or numbers (dot and underscore allowed) and start with a letter.' };
  if (fullName.length < 2 || fullName.length > 60) return { ok: false, error: 'Please enter your full name (2-60 characters).' };
  if (password.length < 4) return { ok: false, error: 'Password must have at least 4 characters.' };
  const db = loadDb();
  if (db.users[username]) return { ok: false, error: 'This username is already taken on this PC.' };
  const salt = crypto.randomBytes(16).toString('hex');
  const rsalt = crypto.randomBytes(16).toString('hex');
  const recoveryCode = makeRecoveryCode();
  db.users[username] = {
    fullName,
    color: COLORS[Object.keys(db.users).length % COLORS.length],
    salt,
    hash: hashSecret(password, salt),
    rsalt,
    rhash: hashSecret(recoveryCode, rsalt),
    created: Date.now(),
    lastLogin: Date.now(),
    data: {},
  };
  saveDb(db);
  currentUser = username;
  return { ok: true, recoveryCode, user: publicUser(username, db.users[username]) };
});

ipcMain.handle('users:login', (_e, { username, password }) => {
  username = String(username || '').trim().toLowerCase();
  const lock = failed[username];
  if (lock && lock.until > Date.now()) {
    return { ok: false, error: `Too many tries. Please wait ${Math.ceil((lock.until - Date.now()) / 1000)} seconds.` };
  }
  const db = loadDb();
  const u = db.users[username];
  if (!u || !safeEqual(hashSecret(String(password || ''), u.salt), u.hash)) {
    const f = failed[username] || { count: 0, until: 0 };
    f.count += 1;
    if (f.count >= 5) { f.until = Date.now() + 30000; f.count = 0; }
    failed[username] = f;
    return { ok: false, error: 'Wrong username or password.' };
  }
  delete failed[username];
  u.lastLogin = Date.now();
  saveDb(db);
  currentUser = username;
  return { ok: true, user: publicUser(username, u) };
});

ipcMain.handle('users:recover', (_e, { username, code, newPassword }) => {
  username = String(username || '').trim().toLowerCase();
  const db = loadDb();
  const u = db.users[username];
  const clean = String(code || '').trim().toUpperCase();
  if (!u || !safeEqual(hashSecret(clean, u.rsalt), u.rhash)) return { ok: false, error: 'That recovery code does not match this profile.' };
  if (String(newPassword || '').length < 4) return { ok: false, error: 'New password must have at least 4 characters.' };
  u.salt = crypto.randomBytes(16).toString('hex');
  u.hash = hashSecret(newPassword, u.salt);
  const recoveryCode = makeRecoveryCode();
  u.rsalt = crypto.randomBytes(16).toString('hex');
  u.rhash = hashSecret(recoveryCode, u.rsalt);
  saveDb(db);
  return { ok: true, recoveryCode };
});

ipcMain.handle('users:logout', () => { currentUser = null; return true; });

ipcMain.handle('users:save', (_e, data) => {
  if (!currentUser) return false;
  const db = loadDb();
  if (!db.users[currentUser]) return false;
  db.users[currentUser].data = data;
  saveDb(db);
  return true;
});

ipcMain.handle('users:update', (_e, { fullName, oldPassword, newPassword }) => {
  if (!currentUser) return { ok: false, error: 'Not signed in.' };
  const db = loadDb();
  const u = db.users[currentUser];
  if (fullName !== undefined) {
    const f = String(fullName).trim().replace(/\s+/g, ' ');
    if (f.length < 2 || f.length > 60) return { ok: false, error: 'Full name must be 2-60 characters.' };
    u.fullName = f;
  }
  if (newPassword !== undefined) {
    if (!safeEqual(hashSecret(String(oldPassword || ''), u.salt), u.hash)) return { ok: false, error: 'Current password is wrong.' };
    if (String(newPassword).length < 4) return { ok: false, error: 'New password must have at least 4 characters.' };
    u.salt = crypto.randomBytes(16).toString('hex');
    u.hash = hashSecret(String(newPassword), u.salt);
  }
  saveDb(db);
  return { ok: true, user: publicUser(currentUser, u) };
});

ipcMain.handle('users:delete', (_e, { password }) => {
  if (!currentUser) return { ok: false, error: 'Not signed in.' };
  const db = loadDb();
  const u = db.users[currentUser];
  if (!safeEqual(hashSecret(String(password || ''), u.salt), u.hash)) return { ok: false, error: 'Password is wrong.' };
  delete db.users[currentUser];
  saveDb(db);
  currentUser = null;
  return { ok: true };
});

ipcMain.handle('users:export', async () => {
  if (!currentUser) return { ok: false };
  const db = loadDb();
  const r = await dialog.showSaveDialog(win, {
    title: 'Save my XTyping progress',
    defaultPath: `xtyping-${currentUser}-progress.json`,
    filters: [{ name: 'XTyping progress', extensions: ['json'] }],
  });
  if (r.canceled || !r.filePath) return { ok: false };
  fs.writeFileSync(r.filePath, JSON.stringify({ app: 'xtyping', username: currentUser, data: db.users[currentUser].data }, null, 1));
  return { ok: true, path: r.filePath };
});

ipcMain.handle('users:import', async () => {
  if (!currentUser) return { ok: false };
  const r = await dialog.showOpenDialog(win, {
    title: 'Load XTyping progress',
    properties: ['openFile'],
    filters: [{ name: 'XTyping progress', extensions: ['json'] }],
  });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  try {
    const j = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8'));
    if (j.app !== 'xtyping' || typeof j.data !== 'object') return { ok: false, error: 'This is not an XTyping progress file.' };
    const db = loadDb();
    db.users[currentUser].data = j.data;
    saveDb(db);
    return { ok: true, data: j.data };
  } catch {
    return { ok: false, error: 'Could not read that file.' };
  }
});
