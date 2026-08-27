/* eslint-disable import/no-commonjs, import/no-nodejs-modules */
const path = require('path');

module.exports = {
// @ts-expect-error -- legacy JavaScript UI type boundary
  process(_, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
