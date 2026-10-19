function getOverlayStyles({ mapSize, titlebarHeight }) {
const PAGE_LAYOUT_CSS = `
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

`;

const MAP_VIEWPORT_CSS = `
  /* Keep the map below the title bar. */
  .pm-leaflet-map {
    position: fixed !important;
    left: 0 !important;
    top: ${titlebarHeight}px !important;
    width: ${mapSize}px !important;
    height: ${mapSize}px !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    outline: none !important;
  }

  /* Hide the map's corner controls. */
  .leaflet-control-container {
    display: none !important;
  }
`;

const PRIMORD_PAGE_CHROME_CSS = `
  /* Hide the site's panels around the map. */
  .pm-map-panel-shell,
  .pm-shell-topbar,
  .pm-map-header,
  .pm-shell-bottom-nav,
  .pm-map-live-pill,
  .pm-shell-sidebar-spacer {
    display: none !important;
  }

  .pm-shell-main.primord-map-page {
    overflow: hidden !important;
  }

  .pm-shell-main.primord-map-page::-webkit-scrollbar {
    display: none !important;
  }
`;

const COLLAPSED_TOOLBAR_STATE_CSS = `
  html.primord-toolbar-collapsed,
  html.primord-toolbar-collapsed body {
    visibility: hidden !important;
  }

  html.primord-toolbar-collapsed .pm-leaflet-map,
  html.primord-toolbar-collapsed #primord-show-toolbar {
    visibility: visible !important;
  }

  #primord-overlay-titlebar[hidden],
  #primord-show-toolbar[hidden] {
    display: none !important;
  }
`;

const TITLEBAR_CSS = `
  /* Custom draggable title bar and its controls. */
  #primord-overlay-titlebar {
    position: fixed;
    top: 0;
    left: 0;
    width: ${mapSize}px;
    height: ${titlebarHeight}px;
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
`;

const SHOW_TOOLBAR_BUTTON_CSS = `
  /* Floating control that restores the collapsed title bar. */
  #primord-show-toolbar {
    position: fixed;
    top: 5px;
    right: 8px;
    left: auto;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 26px;
    height: 25px;
    padding: 0;
    border: 1px solid #454b55;
    border-radius: 5px;
    color: #f4f6fa;
    background: #20242b;
    font: 14px/1 Arial, sans-serif;
    cursor: pointer;
    -webkit-app-region: no-drag;
  }

  #primord-show-toolbar:hover {
    background: #596273;
  }
`;

const RESIZE_HANDLE_CSS = `
  /* Bottom-right handle for resizing the overlay. */
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
`;

  return [PAGE_LAYOUT_CSS, MAP_VIEWPORT_CSS, PRIMORD_PAGE_CHROME_CSS, COLLAPSED_TOOLBAR_STATE_CSS, TITLEBAR_CSS, SHOW_TOOLBAR_BUTTON_CSS, RESIZE_HANDLE_CSS].join("\n");
}

module.exports = { getOverlayStyles };
