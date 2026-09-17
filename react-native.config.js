// react-native.config.js
// eslint-disable-next-line import/no-commonjs
module.exports = {
  dependencies: {
    '@metamask/react-native-aes-crypto-forked': {
      platforms: {
        ios: null, // disable Android platform, other platforms will still autolink if provided
      },
    },
  },
  assets: ['./app/fonts/'],
};
