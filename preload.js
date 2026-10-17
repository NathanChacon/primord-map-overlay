const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlayControls", {
  minimize: () => ipcRenderer.send("overlay:minimize"),
  close: () => ipcRenderer.send("overlay:close"),
  reportMapPageState: (isMapPage) =>
    ipcRenderer.send("overlay:map-page", isMapPage),
});
