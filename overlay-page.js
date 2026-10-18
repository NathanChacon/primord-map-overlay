const overlayPageScript = `
      (() => {
        const MAP_SELECTOR = ".pm-leaflet-map";
        const PLAYER_MARKER_SELECTOR =
          ".leaflet-marker-icon.pm-map-marker-icon.leaflet-zoom-animated.leaflet-interactive";
        const TITLEBAR_ID = "primord-overlay-titlebar";
        const SHOW_TOOLBAR_BUTTON_ID = "primord-show-toolbar";
        let previousMapPageState = null;

        function getVisibleMapElement() {
          const mapElement = document.querySelector(MAP_SELECTOR);
          return mapElement?.isConnected && mapElement.getClientRects().length
            ? mapElement
            : null;
        }

        function updateMapPageClasses(isMapPage) {
          for (const element of [
            document.documentElement,
            document.body,
            document.getElementById("root"),
            document.getElementById("app"),
          ]) {
            element?.classList.toggle("primord-map-page", isMapPage);
          }
        }

        function reportMapPageState() {
          const isMapPage = Boolean(getVisibleMapElement());
          updateMapPageClasses(isMapPage);
          const toolbar = document.getElementById(TITLEBAR_ID);
          document.documentElement.classList.toggle(
            "primord-toolbar-collapsed",
            Boolean(toolbar?.hidden && isMapPage),
          );
          if (isMapPage === previousMapPageState) return;
          previousMapPageState = isMapPage;
          window.overlayControls.reportMapPageState(isMapPage);
        }

        function getMapFromReactLeafletContext(contextValue, mapElement) {
          const map = contextValue?.map;
          if (typeof map?.panTo !== "function" || typeof map?.getContainer !== "function") {
            return null;
          }

          try {
            return map.getContainer() === mapElement ? map : null;
          } catch {
            return null;
          }
        }

        function getReactFiberByElement(mapElement) {
          if (!mapElement) return null;

          const fiberKey = Object.keys(mapElement).find((key) =>
            key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$"),
          );
          return fiberKey ? mapElement[fiberKey] : null;
        }

        function getMapFromFiberHooks(fiber, mapElement) {
          for (let hook = fiber.memoizedState; hook; hook = hook.next) {
            const map = getMapFromReactLeafletContext(hook.memoizedState, mapElement);
            if (map) return map;
          }
          return null;
        }

        function getMapFromFiberDependencies(fiber, mapElement) {
          let dependency = fiber.dependencies?.firstContext;
          while (dependency) {
            const map = getMapFromReactLeafletContext(dependency.memoizedValue, mapElement);
            if (map) return map;
            dependency = dependency.next;
          }
          return null;
        }

        function getLeafletMapByElement(mapElement) {
          let fiber = getReactFiberByElement(mapElement);

          // React-Leaflet's MapContainer stores its { map } context value in hook state.
          while (fiber) {
            const mapFromHooks = getMapFromFiberHooks(fiber, mapElement);
            if (mapFromHooks) return mapFromHooks;

            const mapFromDependencies = getMapFromFiberDependencies(fiber, mapElement);
            if (mapFromDependencies) return mapFromDependencies;

            fiber = fiber.return;
          }
          return null;
        }

        function getVisiblePlayerMarker(mapElement) {
          return [...mapElement.querySelectorAll(PLAYER_MARKER_SELECTOR)].find(
            (element) =>
              element.querySelector(".pm-map-marker--self") && element.getClientRects().length,
          ) ?? null;
        }

        function getPlayerPosition(map, mapElement, marker) {
          const markerLayer = map._targets?.[marker._leaflet_id];
          const markerPosition = markerLayer?.getLatLng?.();
          if (markerPosition) return markerPosition;

          const mapBounds = mapElement.getBoundingClientRect();
          const markerBounds = marker.getBoundingClientRect();
          return map.containerPointToLatLng([
            markerBounds.left + markerBounds.width / 2 - mapBounds.left,
            markerBounds.top + markerBounds.height / 2 - mapBounds.top,
          ]);
        }

        function centerMapOnPlayer() {
          const mapElement = getVisibleMapElement();
          if (!mapElement) return;

          const marker = getVisiblePlayerMarker(mapElement);
          if (!marker) return;
          const map = getLeafletMapByElement(mapElement);
          if (!map) {
            console.warn("Não foi possível localizar o mapa para focar no jogador.");
            return;
          }

          map.panTo(getPlayerPosition(map, mapElement, marker), {
            animate: true,
            duration: 0.25,
          });
        }

        function createToolbarButton({ id, text, title, onClick }) {
          const button = document.createElement("button");
          if (id) button.id = id;
          if (text) button.textContent = text;
          button.title = title;
          button.setAttribute("aria-label", title);
          button.addEventListener("click", onClick);
          return button;
        }

        function setEyeIcon(button, isVisible) {
          const crossedOut = isVisible ? "" : '<path d="M3 3l18 18"/>';
          button.innerHTML =
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>' +
            crossedOut +
            "</svg>";
        }

        function createOverlayTitlebar() {
          const bar = document.createElement("div");
          bar.id = TITLEBAR_ID;

          const title = document.createElement("span");
          title.className = "primord-title";
          title.textContent = "F8 MOSTRAR/OCULTAR | CTRL+F8 INTERAGIR";

          const hideToolbar = createToolbarButton({
            id: "primord-hide-toolbar",
            title: "Ocultar barra de ferramentas",
            onClick: () => setToolbarVisibility(false),
          });
          setEyeIcon(hideToolbar, false);
          const focus = createToolbarButton({
            id: "primord-focus",
            title: "Centralizar no jogador",
            onClick: centerMapOnPlayer,
          });
          focus.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="8" r="2.2"/><path d="M7.5 18c.5-3.2 2-5 4.5-5s4 1.8 4.5 5"/></svg>';

          const minimize = createToolbarButton({
            text: "−",
            title: "Minimizar mapa",
            onClick: () => window.overlayControls.minimize(),
          });
          const close = createToolbarButton({
            id: "primord-close",
            text: "\\u00d7",
            title: "Fechar mapa",
            onClick: () => window.overlayControls.close(),
          });

          bar.append(title, focus, minimize, close, hideToolbar);
          return bar;
        }

        function setToolbarVisibility(isVisible) {
          const toolbar = document.getElementById(TITLEBAR_ID);
          const showToolbarButton = document.getElementById(SHOW_TOOLBAR_BUTTON_ID);
          if (!toolbar || !showToolbarButton) return;

          toolbar.hidden = !isVisible;
          showToolbarButton.hidden = isVisible;
          document.documentElement.classList.toggle(
            "primord-toolbar-collapsed",
            Boolean(!isVisible && getVisibleMapElement()),
          );
        }

        function addOverlayTitlebar() {
          if (document.getElementById(TITLEBAR_ID)) return;
          document.body.appendChild(createOverlayTitlebar());

          const showToolbarButton = createToolbarButton({
            id: SHOW_TOOLBAR_BUTTON_ID,
            title: "Mostrar barra de ferramentas",
            onClick: () => setToolbarVisibility(true),
          });
          setEyeIcon(showToolbarButton, true);
          showToolbarButton.hidden = true;
          document.body.appendChild(showToolbarButton);

          // Ask Leaflet to recalculate its viewport after layout changes.
          requestAnimationFrame(() => {
            window.dispatchEvent(new Event("resize"));
            reportMapPageState();
          });
        }

        function startMapPageDetection() {
          reportMapPageState();
          window.setInterval(reportMapPageState, 500);
        }

        function initializeOverlayPage() {
          addOverlayTitlebar();
          startMapPageDetection();
        }

        if (document.body) {
          initializeOverlayPage();
        } else {
          document.addEventListener("DOMContentLoaded", initializeOverlayPage, {
            once: true,
          });
        }
      })();
`;

module.exports = { overlayPageScript };
