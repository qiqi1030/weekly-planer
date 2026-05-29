const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  togglePin: () => ipcRenderer.invoke('toggle-pin'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  onPinChanged: (callback) => ipcRenderer.on('pin-changed', (_, val) => callback(val)),
  onAutoLaunchChanged: (callback) => ipcRenderer.on('autolaunch-changed', (_, val) => callback(val)),

});
