// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

// See: https://docs.expo.dev/guides/monorepos/#automatic-configuration
const config = getDefaultConfig(__dirname);

module.exports = config;
