// Metro config pentru Expo în monorepo (npm workspaces + Turborepo).
// Watch întreg workspace-ul + rezolvă node_modules din ambele niveluri,
// ca să poată folosi @tradegx/* (core, api-client, ui-tokens, config).
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// Lookup ierarhic rămâne ACTIV — npm workspaces hoistează la root, deci Metro
// trebuie să urce arborele pentru deps tranzitive (ex. polyfill-ul `promise` al RN).
// Pachetele @tradegx/* sunt sursă TS și sunt în watchFolders → Metro le transpilează.

module.exports = withNativeWind(config, { input: "./global.css" });
