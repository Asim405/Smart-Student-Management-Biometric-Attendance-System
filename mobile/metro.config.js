const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Patch internal Metro module resolution for Node.js package exports
try {
  require('metro/src/lib/TerminalReporter');
} catch (e) {
  // Silence module resolution error
}

const config = getDefaultConfig(__dirname);

// Disable strict package exports in Metro resolver
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: './global.css' });