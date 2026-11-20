const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('native', {
  saveFile: (opts) => ipcRenderer.invoke('save-file', opts),
  openFile: (opts) => ipcRenderer.invoke('open-file', opts),
  setFullScreen: (on) => ipcRenderer.send('fullscreen', !!on),
  onMenu: (cb) => ipcRenderer.on('menu', (_e, action) => cb(action))
});
