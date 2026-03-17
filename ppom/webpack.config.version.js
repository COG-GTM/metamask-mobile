const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/blockaid-version.js',
  output: {
    path: path.resolve(__dirname, '../app/lib/ppom'),
    filename: 'blockaid-version.ts',
    library: {
      type: 'module',
    },
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: '// @ts-nocheck',
      raw: true,
    }),
  ],
  experiments: { outputModule: true },
};
