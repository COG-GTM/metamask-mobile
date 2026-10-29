// react-native.config.js
// eslint-disable-next-line import/no-commonjs
module.exports = {
  dependencies: {
    'react-native-aes-crypto-forked': {
      platforms: {
        ios: null, // disable Android platform, other platforms will still autolink if provided
      },
    },
    // Transitive dep of react-native-scrollable-tab-view (Android-only there). Expo 54 autolinking now
    // picks it up, and its iOS classes clash with react-native-pager-view.
    '@react-native-community/viewpager': {
      platforms: {
        ios: null,
      },
    },
  },
  assets: ['./app/fonts/'],
};
