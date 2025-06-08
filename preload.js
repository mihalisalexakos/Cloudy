// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    listProjects: (folder) => ipcRenderer.invoke('list-projects', folder),
    openInBrowser: (path) => ipcRenderer.invoke('open-in-browser', path),
    openInVSCode: (path) => ipcRenderer.invoke('open-in-vscode', path),
    createFolder: (parentDir, name) => ipcRenderer.invoke('create-folder', { parentDir, name })
});
