import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Animated, StyleSheet } from 'react-native';
import Device from '../../../util/device';
import { useTheme } from '../../../util/theme';

const create_styles = (colors) =>
  StyleSheet.create({
    view: {
      backgroundColor: colors.background.default,
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  });

/**
 * View that is displayed to first time (new) users
 */
export default function FadeOutOverlay({
  style = null,
  duration = Device.isAndroid() ? 300 : 300,
}) {
  const [done, set_done] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();
  const styles = create_styles(colors);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration,
      useNativeDriver: true,
      isInteraction: false,
    }).start(() => {
      set_done(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;
  return <Animated.View style={[{ opacity }, styles.view, style]} />;
}

FadeOutOverlay.propTypes = {
  style: PropTypes.any,
  duration: PropTypes.number,
};
