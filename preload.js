const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlayControls", {
  minimize: () => ipcRenderer.send("overlay:minimize"),
  close: () => ipcRenderer.send("overlay:close"),
  setMapPage: (isMapPage) => ipcRenderer.send("overlay:map-page", isMapPage),
});
