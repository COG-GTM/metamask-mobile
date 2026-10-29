// react-native.config.js
// eslint-disable-next-line import/no-commonjs
module.exports = {
  dependencies: {
    'react-native-aes-crypto-forked': {
      platforms: {
        ios: null, // disable Android platform, other platforms will still autolink if provided
      },
    },
    // Transitive dep of react-native-scrollable-tab-view, which is patched to use react-native-pager-view.
    // Expo 54 autolinking picks it up; both register the native view `RNCViewPager`, so it would shadow
    // react-native-pager-view (Android: setPage ignored, iOS: duplicate symbols).
    '@react-native-community/viewpager': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
  assets: ['./app/fonts/'],
};
