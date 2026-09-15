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
// Monorepo: evita que Metro resuelva React 18 de landing-page. expo-doctor lo marca;
// mantenerlo hasta que el resto del workspace no arrastre otra versión de React.
config.resolver.disableHierarchicalLookup = true;
function resolvePackage(name) {
  return path.dirname(
    require.resolve(`${name}/package.json`, {
      paths: [projectRoot, workspaceRoot],
    }),
  );
}

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: resolvePackage("react"),
  "react-native": resolvePackage("react-native"),
  "@expo-google-fonts/work-sans": resolvePackage("@expo-google-fonts/work-sans"),
  "@expo-google-fonts/arvo": resolvePackage("@expo-google-fonts/arvo"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
