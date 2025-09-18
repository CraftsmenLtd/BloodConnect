// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require('@expo/metro-config');

// See: https://docs.expo.dev/guides/monorepos/#automatic-configuration
const config = getDefaultConfig(__dirname);

// Fix for React Native 0.81+ property descriptor issues
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require'];

module.exports = config;
