const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Ensure proper module resolution
config.resolver.platforms = ["ios", "android", "native", "web"];

// Add custom resolver for problematic modules
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

// Ensure proper module resolution paths
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "src"),
  ...(config.resolver.nodeModulesPaths || []),
];

// Add resolver for .js and .jsx files
config.resolver.sourceExts = ["js", "jsx", "json", "ts", "tsx"];

// Ensure proper asset resolution
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);

// Add watchman configuration
config.watchFolders = [
  path.resolve(__dirname, "src"),
  path.resolve(__dirname, "node_modules"),
];

module.exports = config;
