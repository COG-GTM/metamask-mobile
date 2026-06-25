/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-nocheck Jest loads this transformer directly via the Node CommonJS
// require (it is not run through Babel/ts), so it must stay free of inline
// TypeScript syntax. Types are documented via JSDoc below.
/* eslint-disable import/no-commonjs, import/no-nodejs-modules, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
const path = require('path');

/**
 * Jest transformer that turns imported asset files into a module exporting the
 * asset's basename. Loaded directly by Jest's runtime (CommonJS), so it must
 * remain free of inline TypeScript syntax.
 *
 * @param {string} _ - The raw source of the asset file (unused).
 * @param {string} filename - The absolute path of the asset file.
 * @returns {{ code: string }} The transformed module source.
 */
module.exports = {
  process(_, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
