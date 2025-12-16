/* eslint-disable import/no-commonjs, import/no-nodejs-modules, @typescript-eslint/no-var-requires */
// Jest transformers are loaded directly by Node before babel-jest can process them,
// so we must use CommonJS syntax here instead of ES modules.
const path = require('path');

module.exports = {
  process(_src, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
