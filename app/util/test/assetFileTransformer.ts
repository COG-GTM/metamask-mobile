/* eslint-disable import/no-commonjs, import/no-nodejs-modules */
import path from 'path';

interface AssetTransformResult {
  code: string;
}

const assetFileTransformer = {
  process(_sourceText: string, filename: string): AssetTransformResult {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};

export = assetFileTransformer;
