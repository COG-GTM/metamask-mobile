/* eslint-disable import/no-commonjs, import/no-nodejs-modules */
import path from 'path';

const transformer = {
  process(_: string, filename: string) {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};

module.exports = transformer;
