const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 기본 watchFolders를 유지하면서 모노레포 루트를 추가
config.watchFolders = [...config.watchFolders, monorepoRoot];

// 기본 nodeModulesPaths를 유지하면서 모노레포 루트를 추가
config.resolver.nodeModulesPaths = [
  ...config.resolver.nodeModulesPaths,
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
