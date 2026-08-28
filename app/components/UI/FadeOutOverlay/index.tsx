import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Device from '../../../util/device';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';

const createStyles = (colors: Colors) =>
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

interface Props {
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

/**
 * View that is displayed to first time (new) users
 */
const FadeOutOverlay = ({
  style = null,
  duration = Device.isAndroid() ? 300 : 300,
}: Props) => {
  const [done, setDone] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();
  const styles = createStyles(colors);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration,
      useNativeDriver: true,
      isInteraction: false,
    }).start(() => {
      setDone(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;
  return <Animated.View style={[{ opacity }, styles.view, style]} />;
};

export default FadeOutOverlay;
