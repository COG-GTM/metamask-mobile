/* eslint-disable import/no-commonjs, import/no-nodejs-modules */
import path from 'path';

interface JestTransformerResult {
  code: string;
}

export = {
  process(_: string, filename: string): JestTransformerResult {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
