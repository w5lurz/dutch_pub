const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// @dutch-pub/shared is linked via "file:../packages/shared", which npm creates as a symlink
// (a junction on Windows) pointing outside the project root. The dev server's on-demand
// filesystem doesn't follow it, so imports fail with "Unable to resolve @dutch-pub/shared".
// Map the package straight to its real folder, and watch that folder so rebuilds of
// packages/shared/dist hot-reload. (`expo export` resolves it even without this, so test
// resolution with `expo start`.)
const sharedDir = path.resolve(__dirname, '../packages/shared');
config.watchFolders = [...(config.watchFolders ?? []), sharedDir];
config.resolver.extraNodeModules = { ...config.resolver.extraNodeModules, '@dutch-pub/shared': sharedDir };

module.exports = withNativeWind(config, { input: './src/global.css' });
