// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — This file is loaded raw by jest as a transformer (not through babel),
// so it cannot use TypeScript syntax. The ts-nocheck suppresses implicit-any errors.
/* eslint-disable import/no-commonjs, import/no-nodejs-modules, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  process(_, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
