// React 19 / React Native 0.78 compatibility shims for tests
//
// 1. React 19 renamed __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED to
//    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.
//    react-shallow-renderer (used by enzyme) depends on the old name.
//
// 2. React Native 0.78 removed .propTypes from core components (Text,
//    TouchableOpacity, etc). @metamask/react-native-button accesses
//    Text.propTypes.allowFontScaling at import time, causing crashes.

/* eslint-disable import/no-commonjs */
const React = require('react');
if (
  !React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED &&
  React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
) {
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED =
    React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
}

// Patch React Native components that lost .propTypes in RN 0.78.
// @metamask/react-native-button accesses these at import time.
const RN = require('react-native');
const PropTypes = require('prop-types');

const stylePropType = PropTypes.oneOfType([
  PropTypes.object,
  PropTypes.array,
  PropTypes.number,
]);

if (RN.Text && !RN.Text.propTypes) {
  RN.Text.propTypes = {
    allowFontScaling: PropTypes.bool,
    style: stylePropType,
  };
}
if (RN.TouchableOpacity && !RN.TouchableOpacity.propTypes) {
  RN.TouchableOpacity.propTypes = {};
}
if (!RN.ViewPropTypes) {
  RN.ViewPropTypes = { style: stylePropType };
}
if (RN.Image && !RN.Image.propTypes) {
  RN.Image.propTypes = {
    source: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
    style: stylePropType,
  };
}
if (RN.Animated && RN.Animated.Text && !RN.Animated.Text.propTypes) {
  RN.Animated.Text.propTypes = {
    style: stylePropType,
  };
}
/* eslint-enable import/no-commonjs */
