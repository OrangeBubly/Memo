const { app, BrowserWindow, Menu, shell, session, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 760,
    minHeight: 560,
    title: 'Memo',
    backgroundColor: '#f7f5f0',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  // Allow microphone (voice recording) without extra prompts — this is a local app.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(['media', 'microphone', 'audioCapture', 'clipboard-read', 'clipboard-sanitized-write'].includes(permission));
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission) =>
    ['media', 'microphone', 'audioCapture'].includes(permission));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

// Native file dialogs for import/export.
ipcMain.handle('save-file', async (_e, { defaultName, content, filters }) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: defaultName, filters });
  if (r.canceled || !r.filePath) return false;
  fs.writeFileSync(r.filePath, content, 'utf8');
  return r.filePath;
});

ipcMain.handle('open-file', async (_e, { filters, multi }) => {
  const r = await dialog.showOpenDialog(win, {
    filters,
    properties: multi ? ['openFile', 'multiSelections'] : ['openFile']
  });
  if (r.canceled) return [];
  return r.filePaths.map(p => ({ name: path.basename(p), content: fs.readFileSync(p, 'utf8') }));
});

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      { label: 'New Text', accelerator: 'CmdOrCtrl+N', click: () => win.webContents.send('menu', 'new') },
      { label: 'Import Text Files…', accelerator: 'CmdOrCtrl+O', click: () => win.webContents.send('menu', 'import') },
      { label: 'Back Up Library…', click: () => win.webContents.send('menu', 'backup') },
      { label: 'Restore Library…', click: () => win.webContents.send('menu', 'restore') },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  { role: 'editMenu' },
  {
    label: 'View',
    submenu: [
      { role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' },
      { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
      { type: 'separator' }, { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Help',
    submenu: [{ label: 'How to use Memo', click: () => win.webContents.send('menu', 'help') }]
  }
];

app.whenReady().then(() => {
  if (process.platform === 'win32') app.setAppUserModelId('com.orangebubly.memo');
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
