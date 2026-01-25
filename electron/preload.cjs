const { contextBridge, ipcRenderer } = require('electron');

// Scaffold: expor API mínima quando precisarmos (ex.: seletor de pasta para importar tiles).
contextBridge.exposeInMainWorld('siscqtDesktop', {
  version: 'scaffold',
  openExternal: (url) => ipcRenderer.invoke('siscqt:openExternal', url),
});

