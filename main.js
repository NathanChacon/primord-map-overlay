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
const MAP_ORIGIN = new URL(MAP_URL).origin;
const STEAM_AUTH_ORIGINS = new Set([
  "https://steamcommunity.com",
  "https://store.steampowered.com",
]);

const PARTITION = "persist:primord";

const MAP_SIZE = 400;
const TITLEBAR_HEIGHT = 36;
const WINDOW_HEIGHT = MAP_SIZE + TITLEBAR_HEIGHT;

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

  // Steam OpenID runs in a separate window. It shares the app's session so
  // Steam cookies and the Primord callback are available, while keeping the
  // overlay's own top-level page restricted to Primord.
  mapWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAllowedSteamAuthUrl(url)) return { action: "deny" };

    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        parent: mapWindow,
        width: 900,
        height: 700,
        frame: true,
        resizable: true,
        autoHideMenuBar: true,
        webPreferences: {
          partition: PARTITION,
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
      },
    };
  });
  mapWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedAuthFlowUrl(url)) event.preventDefault();
  });
  mapWindow.webContents.on("will-redirect", (event, url) => {
    if (!isAllowedAuthFlowUrl(url)) event.preventDefault();
  });
  mapWindow.webContents.on("did-create-window", (authWindow) => {
    authWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    authWindow.webContents.on("will-navigate", (event, url) => {
      if (!isAllowedAuthFlowUrl(url)) event.preventDefault();
    });
    authWindow.webContents.on("will-redirect", (event, url) => {
      if (!isAllowedAuthFlowUrl(url)) event.preventDefault();
    });
  });

  applyWindowShape(false);
  keepOverlayOnTop();

  mapWindow.loadURL(MAP_URL);

  mapWindow.webContents.on("did-finish-load", async () => {
    if (!mapWindow || mapWindow.isDestroyed()) return;
    // Do not inject map UI or overlay controls into Steam's login page.
    if (!isAllowedPrimordUrl(mapWindow.webContents.getURL())) return;

    // Each page load starts square; the renderer reports when its map is ready.
    applyWindowShape(false);

    await mapWindow.webContents.insertCSS(`
      html,
      body,
      #root,
      #app {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: auto !important;
        background: transparent !important;
      }

      .primord-map-page {
        overflow: hidden !important;
      }

      .primord-map-page::-webkit-scrollbar {
        display: none !important;
      }

      /* Keep the map below the title bar. */
      .pm-leaflet-map {
        position: fixed !important;
        left: 0 !important;
        top: ${TITLEBAR_HEIGHT}px !important;
        width: ${MAP_SIZE}px !important;
        height: ${MAP_SIZE}px !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        outline: none !important;
      }

      /* Hide the site's surrounding panels. */
      .pm-map-panel-shell,
      .pm-shell-topbar,
      .pm-shell-bottom-nav,
      .pm-map-live-pill,
      .pm-shell-sidebar-spacer {
        display: none !important;
      }

      /* Optional: hide the map's corner controls. */
      .leaflet-control-container {
        display: none !important;
      }

      /* Our custom draggable title bar. */
      #primord-overlay-titlebar {
        position: fixed;
        top: 0;
        left: 0;
        width: ${MAP_SIZE}px;
        height: ${TITLEBAR_HEIGHT}px;
        box-sizing: border-box;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 10px;
        color: #f4f6fa;
        background: #20242b;
        border-bottom: 1px solid #454b55;
        font: 600 12px/1 Arial, sans-serif;
        -webkit-app-region: drag;
        user-select: none;
      }

      #primord-overlay-titlebar .primord-title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 9px;
        letter-spacing: 0;
        white-space: nowrap;
      }

      #primord-overlay-titlebar button {
        -webkit-app-region: no-drag;
        border: 0;
        border-radius: 5px;
        width: 26px;
        height: 25px;
        padding: 0;
        color: white;
        background: #3b414c;
        font: 18px/1 Arial, sans-serif;
        cursor: pointer;
      }

      #primord-overlay-titlebar button:hover {
        background: #596273;
      }

      #primord-overlay-titlebar #primord-close:hover {
        background: #b83d48;
      }


      #primord-resize-handle {
            position: fixed;
            right: 5px;
            bottom: 5px;
            width: 22px;
            height: 22px;
            z-index: 2147483647;
            -webkit-app-region: no-drag;
            cursor: nwse-resize;
            border-radius: 50%;
            background: rgba(25, 29, 36, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font: bold 15px Arial, sans-serif;
            user-select: none;
}

     #primord-resize-handle:hover {
        background: #596273;
    }
    `);

    await mapWindow.webContents.executeJavaScript(`
      (() => {
        let lastReportedMapPage = null;
        const reportMapPage = () => {
          const mapElement = document.querySelector(".pm-leaflet-map");
          const isMapPage = Boolean(
            mapElement && mapElement.isConnected && mapElement.getClientRects().length,
          );
          for (const element of [
            document.documentElement,
            document.body,
            document.getElementById("root"),
            document.getElementById("app"),
          ]) {
            element?.classList.toggle("primord-map-page", isMapPage);
          }
          if (isMapPage === lastReportedMapPage) return;
          lastReportedMapPage = isMapPage;
          window.overlayControls.setMapPage(isMapPage);
        };

        const findMapInstance = (mapElement) => {
          const findInValue = (root, seen = new Set(), maxDepth = 6) => {
            const queue = [{ value: root, depth: 0 }];
            while (queue.length) {
              const { value, depth } = queue.shift();
              if (!value || (typeof value !== "object" && typeof value !== "function") || seen.has(value)) continue;
              seen.add(value);

              if (typeof value.panTo === "function" && typeof value.getContainer === "function") {
                try {
                  if (value.getContainer() === mapElement) return value;
                } catch {}
              }
              if (depth >= maxDepth || value instanceof Element || value instanceof Window) continue;

              for (const key of Object.keys(value).slice(0, 50)) {
                if (["return", "child", "sibling", "alternate", "_events"].includes(key)) continue;
                queue.push({ value: value[key], depth: depth + 1 });
              }
            }
            return null;
          };

          const fiberKey = Object.keys(mapElement).find((key) =>
            key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$"),
          );
          let fiber = fiberKey ? mapElement[fiberKey] : null;
          while (fiber) {
            for (const value of [fiber.memoizedProps, fiber.memoizedState, fiber.stateNode]) {
              const map = findInValue(value);
              if (map) return map;
            }
            let dependency = fiber.dependencies?.firstContext;
            while (dependency) {
              const map = findInValue(dependency.memoizedValue);
              if (map) return map;
              dependency = dependency.next;
            }
            fiber = fiber.return;
          }
          return null;
        };

        const focusPlayer = () => {
          const mapElement = document.querySelector(".pm-leaflet-map");
          const marker = mapElement
            ? [...mapElement.querySelectorAll(
                ".leaflet-marker-icon.pm-map-marker-icon.leaflet-zoom-animated.leaflet-interactive",
              )].find((element) => element.querySelector(".pm-map-marker--self"))
            : null;
          if (!mapElement || !marker || !marker.getClientRects().length) return;

          const map = findMapInstance(mapElement);
          if (!map) {
            console.warn("Não foi possível localizar o mapa para focar no jogador.");
            return;
          }

          const markerLayer = map._targets?.[marker._leaflet_id];
          let latLng = markerLayer?.getLatLng?.();
          if (!latLng) {
            const mapRect = mapElement.getBoundingClientRect();
            const markerRect = marker.getBoundingClientRect();
            latLng = map.containerPointToLatLng([
              markerRect.left + markerRect.width / 2 - mapRect.left,
              markerRect.top + markerRect.height / 2 - mapRect.top,
            ]);
          }
          map.panTo(latLng, { animate: true, duration: 0.25 });
        };

        const addTitlebar = () => {
          if (document.getElementById("primord-overlay-titlebar")) {
            return;
          }

          const bar = document.createElement("div");
          bar.id = "primord-overlay-titlebar";

          const title = document.createElement("span");
          title.className = "primord-title";
          title.textContent = "F8 MOSTRAR/OCULTAR | CTRL+F8 INTERAGIR";

          const minimize = document.createElement("button");
          minimize.textContent = "−";
          minimize.title = "Minimizar mapa";
          minimize.setAttribute("aria-label", "Minimizar mapa");
          minimize.addEventListener("click", () => {
            window.overlayControls.minimize();
          });

          const focus = document.createElement("button");
          focus.id = "primord-focus";
          focus.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="8" r="2.2"/><path d="M7.5 18c.5-3.2 2-5 4.5-5s4 1.8 4.5 5"/></svg>';
          focus.title = "Centralizar no jogador";
          focus.setAttribute("aria-label", "Centralizar no jogador");
          focus.addEventListener("click", focusPlayer);

          const close = document.createElement("button");
          close.id = "primord-close";
          close.textContent = "\\u00d7";
          close.title = "Fechar mapa";
          close.setAttribute("aria-label", "Fechar mapa");
          close.addEventListener("click", () => {
            window.overlayControls.close();
          });

          bar.append(title, focus, minimize, close);
          document.body.appendChild(bar);

          // Ask Leaflet to recalculate its viewport after layout changes.
          requestAnimationFrame(() => {
            window.dispatchEvent(new Event("resize"));
            reportMapPage();
          });
        };

        if (document.body) {
          addTitlebar();
        } else {
          document.addEventListener(
            "DOMContentLoaded",
            addTitlebar,
            { once: true }
          );
        }

        const observer = new MutationObserver(reportMapPage);
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
        reportMapPage();
        window.setInterval(reportMapPage, 500);
      })();
    `);

    keepOverlayOnTop();
  });

  mapWindow.on("blur", keepOverlayOnTop);
  mapWindow.on("restore", keepOverlayOnTop);

  mapWindow.on("closed", () => {
    mapWindow = null;
  });
}

// Only accept these requests from the expected Primord website.
function isPrimordSender(event) {
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

function isAllowedPrimordUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.origin === MAP_ORIGIN;
  } catch {
    return false;
  }
}

function isAllowedSteamAuthUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && STEAM_AUTH_ORIGINS.has(parsed.origin);
  } catch {
    return false;
  }
}

function isAllowedAuthFlowUrl(url) {
  return isAllowedPrimordUrl(url) || isAllowedSteamAuthUrl(url);
}

ipcMain.on("overlay:map-page", (event, isMapPage) => {
  if (!isPrimordSender(event)) return;
  if (mapWindow && !mapWindow.isDestroyed()) {
    applyWindowShape(isMapPage === true);
  }
});

ipcMain.on("overlay:minimize", (event) => {
  if (!isPrimordSender(event)) return;
  if (mapWindow && !mapWindow.isDestroyed()) {
    mapWindow.minimize();
  }
});

ipcMain.on("overlay:close", (event) => {
  if (!isPrimordSender(event)) return;
  if (mapWindow && !mapWindow.isDestroyed()) {
    mapWindow.close();
  }
});

app.whenReady().then(() => {
  const primordSession = session.fromPartition(PARTITION);
  primordSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  createWindow();
  setClickThrough(false);

  // F8: toggle the overlay's visibility.
  globalShortcut.register("F8", () => {
    if (!mapWindow || mapWindow.isDestroyed()) return;

    if (mapWindow.isVisible()) {
      mapWindow.hide();
    } else {
      keepOverlayOnTop();
      mapWindow.show();
    }
  });

  // Ctrl+F8: toggle map interaction until the shortcut is pressed again.
  globalShortcut.register("Control+F8", () => {
    if (!mapWindow || mapWindow.isDestroyed()) return;

    setClickThrough(!clickThrough);
    console.log(clickThrough ? "Interação com o mapa desativada." : "Interação com o mapa ativada.");
  });

  // F9: reload the map.
  globalShortcut.register("F9", () => {
    if (mapWindow && !mapWindow.isDestroyed()) {
      mapWindow.webContents.reload();
    }
  });

  // Ctrl+Shift+F8: clear the saved Primord session.
  globalShortcut.register("Control+Shift+F8", async () => {
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
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  app.quit();
});
