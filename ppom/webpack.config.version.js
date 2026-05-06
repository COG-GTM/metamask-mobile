const path = require('path');

module.exports = {
  entry: './src/blockaid-version.js',
  output: {
    path: path.resolve(__dirname, '../app/lib/ppom'),
    filename: 'blockaid-version.ts',
    library: {
      type: 'module',
    },
  },
  experiments: { outputModule: true },
};
