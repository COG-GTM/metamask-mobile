/* Parity-only wrapper (not committed): worktrees symlink node_modules to the main checkout; Metro does not crawl symlinked dirs outside projectRoot, so watch the real node_modules. */
const path = require('path');
const WT = process.env.PARITY_WT;
const NM = '/home/ubuntu/repos/metamask-mobile/node_modules';
const { createRequire } = require('module');
const wtRequire = createRequire(path.join(WT, 'metro.config.js'));
const { mergeConfig } = wtRequire('@react-native/metro-config');
const inner = require(path.join(WT, 'metro.config.js'));
module.exports = function (base) {
  const cfg = inner(base);
  return mergeConfig(cfg, {
    projectRoot: WT,
    watchFolders: [...(cfg.watchFolders || []), NM],
    resolver: { nodeModulesPaths: [NM], unstable_enableSymlinks: true },
  });
};
