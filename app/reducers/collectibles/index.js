// Compatibility entry point for importers that reference `collectibles/index.js`
// explicitly. The reducer, selectors and action types live in ./index.ts.
// eslint-disable-next-line import/no-commonjs
module.exports = require('./index.ts');
