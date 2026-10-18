const {
  app,
  BrowserWindow,
  globalShortcut,
  session,
  ipcMain,
  screen,
} = require("electron");

const path = require("path");

const MAP_URL = "https://painel.primord-oficial.com/map?serverId=default";

const PARTITION = "persist:primord";

const MAP_SIZE = 400;
const TITLEBAR_HEIGHT = 36;
const WINDOW_HEIGHT = MAP_SIZE + TITLEBAR_HEIGHT;

const { getOverlayStyles } = require("./overlay-styles");
const { overlayPageScript } = require("./overlay-page");
const { registerOverlayIpcHandlers } = require("./ipc-handlers");
const { createNavigationRules } = require("./navigation-rules");
const { registerGlobalShortcuts } = require("./shortcuts");

const { isAllowedPrimordUrl, configurePrimordWindow } =
  createNavigationRules(MAP_URL);

let mapWindow = null;
let clickThrough = false;

function setClickThrough(enabled) {
  if (!mapWindow || mapWindow.isDestroyed()) return;

  clickThrough = enabled;
  mapWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
}

function keepOverlayOnTop() {
  if (!mapWindow || mapWindow.isDestroyed()) return;

  mapWindow.setAlwaysOnTop(true, "screen-saver");
  mapWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
}

// Make the native window consist of a rectangular title bar
// and a circular area underneath it.
function applyWindowShape(showCircle = true) {
  if (!mapWindow || process.platform !== "win32") return;

  if (typeof mapWindow.setShape !== "function") {
  console.warn("Esta versão do Electron não oferece suporte a setShape().");
    return;
  }

  if (!showCircle) {
    mapWindow.setShape([
      { x: 0, y: 0, width: MAP_SIZE, height: WINDOW_HEIGHT },
    ]);
    return;
  }

  const rectangles = [
    {
      x: 0,
      y: 0,
      width: MAP_SIZE,
      height: TITLEBAR_HEIGHT,
    },
  ];

  const center = (MAP_SIZE - 1) / 2;
  const radius = MAP_SIZE / 2;

  for (let y = 0; y < MAP_SIZE; y++) {
    const dy = y - center;
    const halfWidth = Math.sqrt(Math.max(0, radius * radius - dy * dy));

    const left = Math.ceil(center - halfWidth);
    const right = Math.floor(center + halfWidth);

    rectangles.push({
      x: left,
      y: TITLEBAR_HEIGHT + y,
      width: right - left + 1,
      height: 1,
    });
  }

  mapWindow.setShape(rectangles);
}

function createWindow() {
  const workArea = screen.getPrimaryDisplay().workArea;

  mapWindow = new BrowserWindow({
    width: MAP_SIZE,
    height: WINDOW_HEIGHT,
    icon: path.join(__dirname, "assets", "icon.png"),
    x: workArea.x + workArea.width - MAP_SIZE - 20,
    y: workArea.y + 20,

    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    maximizable: false,
    minimizable: true,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    hasShadow: false,
    autoHideMenuBar: true,

    webPreferences: {
      partition: PARTITION,
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  configurePrimordWindow(mapWindow, PARTITION);

  applyWindowShape(false);
  keepOverlayOnTop();

  mapWindow.loadURL(MAP_URL);

  mapWindow.webContents.on("did-finish-load", async () => {
    if (!mapWindow || mapWindow.isDestroyed()) return;
    // Do not inject map UI or overlay controls into Steam's login page.
    if (!isAllowedPrimordUrl(mapWindow.webContents.getURL())) return;

    // Each page load starts square; the renderer reports when its map is ready.
    applyWindowShape(false);

    await mapWindow.webContents.insertCSS(
      getOverlayStyles({ mapSize: MAP_SIZE, titlebarHeight: TITLEBAR_HEIGHT }),
    );

    await mapWindow.webContents.executeJavaScript(overlayPageScript);

    keepOverlayOnTop();
  });

  mapWindow.on("blur", keepOverlayOnTop);
  mapWindow.on("restore", keepOverlayOnTop);

  mapWindow.on("closed", () => {
    mapWindow = null;
  });
}

registerOverlayIpcHandlers({
  ipcMain,
  getMapWindow: () => mapWindow,
  applyWindowShape,
  isAllowedPrimordUrl,
});

app.whenReady().then(() => {
  const primordSession = session.fromPartition(PARTITION);
  primordSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  createWindow();
  setClickThrough(false);

  registerGlobalShortcuts({
    app,
    globalShortcut,
    getMapWindow: () => mapWindow,
    keepOverlayOnTop,
    toggleMapInteraction: () => {
      if (!mapWindow || mapWindow.isDestroyed()) return;
      setClickThrough(!clickThrough);
      console.log(
        clickThrough
          ? "Interação com o mapa desativada."
          : "Interação com o mapa ativada.",
      );
    },
    reloadMap: () => {
      if (mapWindow && !mapWindow.isDestroyed()) {
        mapWindow.webContents.reload();
      }
    },
    clearPrimordSession: async () => {
      const primordSession = session.fromPartition(PARTITION);

      await primordSession.clearStorageData({
        storages: [
          "cookies",
          "localstorage",
          "indexdb",
          "serviceworkers",
          "cachestorage",
        ],
      });

      await primordSession.clearCache();

      if (mapWindow && !mapWindow.isDestroyed()) {
        await mapWindow.loadURL(MAP_URL);
        keepOverlayOnTop();
      }

      console.log("Dados da sessão Primord apagados.");
    },
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
