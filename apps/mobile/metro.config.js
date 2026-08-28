const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// Evita que Metro tome React 18 de landing-page (raíz) y deje la app en negro.
config.resolver.disableHierarchicalLookup = true;
function resolvePackage(name) {
  return path.dirname(
    require.resolve(`${name}/package.json`, { paths: [projectRoot] }),
  );
}

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: resolvePackage("react"),
  "react-native": resolvePackage("react-native"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
