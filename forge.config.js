module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "PrimordMap",
    icon: "assets/icon",
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "primord-overlay",
        setupExe: "PrimordMapSetup.exe",
        setupIcon: "assets/icon.ico",
        authors: "Primord Overlay Community",
        description: "A live map overlay for The Isle Evrima.",
      },
    },
  ],
};
