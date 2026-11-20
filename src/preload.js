const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('native', {
  saveFile: (opts) => ipcRenderer.invoke('save-file', opts),
  openFile: (opts) => ipcRenderer.invoke('open-file', opts),
  setZoom: (f) => webFrame.setZoomFactor(Math.min(1.5, Math.max(0.7, +f || 1))),
  setFullScreen: (on) => ipcRenderer.send('fullscreen', !!on),
  onMenu: (cb) => ipcRenderer.on('menu', (_e, action) => cb(action))
});
