// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require('@expo/metro-config')
const path = require('node:path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// commons/ is not an npm workspace package so Metro's auto-detection omits it.
// Add it explicitly so relative imports into commons/ can be resolved.
module.exports = {
  ...config,
  watchFolders: [...(config.watchFolders ?? []), path.resolve(monorepoRoot, 'commons')],
}
