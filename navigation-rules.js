const STEAM_AUTH_ORIGINS = new Set([
  "https://steamcommunity.com",
  "https://store.steampowered.com",
]);

function createNavigationRules(mapUrl) {
  const mapOrigin = new URL(mapUrl).origin;

  function isAllowedPrimordUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && parsed.origin === mapOrigin;
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

  function restrictNavigation(webContents) {
    webContents.on("will-navigate", (event, url) => {
      if (!isAllowedAuthFlowUrl(url)) event.preventDefault();
    });
    webContents.on("will-redirect", (event, url) => {
      if (!isAllowedAuthFlowUrl(url)) event.preventDefault();
    });
  }

  function configurePrimordWindow(mapWindow, partition) {
    // Steam OpenID uses a separate window with the same session as Primord.
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
            partition,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
          },
        },
      };
    });

    restrictNavigation(mapWindow.webContents);
    mapWindow.webContents.on("did-create-window", (authWindow) => {
      authWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      restrictNavigation(authWindow.webContents);
    });
  }

  return { isAllowedPrimordUrl, configurePrimordWindow };
}

module.exports = { createNavigationRules };
