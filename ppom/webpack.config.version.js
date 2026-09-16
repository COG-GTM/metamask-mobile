const path = require('path');

module.exports = {
  entry: './src/blockaid-version.ts',
  output: {
    path: path.resolve(__dirname, '../app/lib/ppom'),
    filename: 'blockaid-version.js',
    library: {
      type: 'module',
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-typescript'],
          },
        },
      },
    ],
  },
  experiments: { outputModule: true },
};
