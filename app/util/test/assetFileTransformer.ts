/* eslint-disable import/no-commonjs, import/no-nodejs-modules, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  process(_: unknown, filename: string): { code: string } {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
