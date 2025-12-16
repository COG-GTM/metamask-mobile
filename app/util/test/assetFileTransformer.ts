/* eslint-disable import/no-commonjs, import/no-nodejs-modules */
import path from 'path';

interface TransformResult {
  code: string;
}

module.exports = {
  process(_: string, filename: string): TransformResult {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
