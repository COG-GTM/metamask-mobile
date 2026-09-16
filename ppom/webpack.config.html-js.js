const path = require('path');

module.exports = {
  entry: './src/ppom.html.ts',
  output: {
    path: path.resolve(__dirname, '../app/lib/ppom'),
    filename: 'ppom.html.js',
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
      {
        test: /\.html$/,
        use: 'raw-loader',
      },
    ],
  },
  experiments: { outputModule: true },
};
