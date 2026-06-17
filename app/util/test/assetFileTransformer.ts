/* eslint-disable */
// @ts-nocheck
// Jest asset transformer. Loaded directly by Jest's runtime (not through the
// babel transform pipeline), so it must remain plain CommonJS without TS syntax.
const path = require('path');

module.exports = {
  process(_, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
