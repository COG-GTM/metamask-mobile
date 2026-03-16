/* eslint-disable import/no-commonjs, import/no-nodejs-modules */
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  process(_, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
