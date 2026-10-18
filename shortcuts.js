function registerGlobalShortcuts({
  app,
  globalShortcut,
  getMapWindow,
  keepOverlayOnTop,
  toggleMapInteraction,
  reloadMap,
  clearPrimordSession,
}) {
  // F8: minimize the overlay to the taskbar or restore it.
  globalShortcut.register("F8", () => {
    const mapWindow = getMapWindow();
    if (!mapWindow || mapWindow.isDestroyed()) return;

    if (mapWindow.isMinimized()) {
      mapWindow.restore();
      keepOverlayOnTop();
    } else {
      mapWindow.minimize();
    }
  });

  // Ctrl+F8: toggle map interaction until the shortcut is pressed again.
  globalShortcut.register("Control+F8", toggleMapInteraction);

  // F9: reload the map.
  globalShortcut.register("F9", reloadMap);

  // Ctrl+Shift+F8: clear the saved Primord session.
  globalShortcut.register("Control+Shift+F8", clearPrimordSession);

  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
  });
}

module.exports = { registerGlobalShortcuts };
