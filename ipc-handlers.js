function registerOverlayIpcHandlers({
  ipcMain,
  getMapWindow,
  applyWindowShape,
  isAllowedPrimordUrl,
}) {
  function isPrimordSender(event) {
    const mapWindow = getMapWindow();
    try {
      return (
        event.sender === mapWindow?.webContents &&
        event.senderFrame === event.sender.mainFrame &&
        isAllowedPrimordUrl(event.senderFrame.url)
      );
    } catch {
      return false;
    }
  }

  ipcMain.on("overlay:map-page", (event, isMapPage) => {
    if (!isPrimordSender(event)) return;
    const mapWindow = getMapWindow();
    if (mapWindow && !mapWindow.isDestroyed()) {
      applyWindowShape(isMapPage === true);
    }
  });

  ipcMain.on("overlay:minimize", (event) => {
    if (!isPrimordSender(event)) return;
    const mapWindow = getMapWindow();
    if (mapWindow && !mapWindow.isDestroyed()) {
      mapWindow.minimize();
    }
  });

  ipcMain.on("overlay:close", (event) => {
    if (!isPrimordSender(event)) return;
    const mapWindow = getMapWindow();
    if (mapWindow && !mapWindow.isDestroyed()) {
      mapWindow.close();
    }
  });
}

module.exports = { registerOverlayIpcHandlers };
