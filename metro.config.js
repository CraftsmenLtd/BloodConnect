import { getDefaultConfig } from 'expo/metro-config';
import { resolve } from 'path';

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const monorepoRoot = resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  resolve(projectRoot, 'node_modules'),
  resolve(monorepoRoot, 'node_modules'),
];

export default config;
