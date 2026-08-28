import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Device from '../../../util/device';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';

export enum SpinnerSize {
  MD = 'MD',
  SM = 'SM',
}

interface Measure {
  Android: {
    height: number;
    width: number;
  };
  iOS: {
    height: number;
    width: number;
  };
  static: {
    borderRadius: number;
    width: number;
    height: number;
    iconSize: number;
  };
}

interface Props {
  size?: SpinnerSize;
  testID?: string;
}

const measures: Record<SpinnerSize, Measure> = {
  [SpinnerSize.SM]: {
    Android: {
      height: 30.5,
      width: 30.5,
    },
    iOS: {
      height: 28,
      width: 28,
    },
    static: {
      borderRadius: 48,
      width: 24,
      height: 24,
      iconSize: 24,
    },
  },
  [SpinnerSize.MD]: {
    Android: {
      height: 41.5,
      width: 41.5,
    },
    iOS: {
      height: 40,
      width: 40,
    },
    static: {
      borderRadius: 64,
      width: 36,
      height: 36,
      iconSize: 36,
    },
  },
};

const createStyles = (colors: Colors, measure: Measure) =>
  StyleSheet.create({
    view: {
      position: 'relative',
      height: Device.isAndroid() ? measure.Android.height : measure.iOS.height,
      width: Device.isAndroid() ? measure.Android.width : measure.iOS.width,
      top: Device.isAndroid() ? -6 : -5.5,
      left: Device.isAndroid() ? -6 : -5.5,
    },
    static: {
      borderWidth: 3.5,
      borderColor: colors.background.alternative,
      borderRadius: measure.static.borderRadius,
      width: measure.static.width,
      height: measure.static.height,
    },
  });

const AnimatedSpinner = ({ size = SpinnerSize.MD }: Props) => {
  const { colors } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    const animation = () => {
      spinValue.setValue(0);

      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }).start(() => {
        if (mounted) {
          animation();
        }
      });
    };

    animation();

    return () => {
      mounted = false;
    };
  }, [spinValue]);

  const styles = createStyles(colors, measures[size]);
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.static}>
      <Animated.View style={[styles.view, { transform: [{ rotate: spin }] }]}>
        <Icon
          name="loading"
          size={measures[size].static.iconSize}
          color={colors.primary.default}
        />
      </Animated.View>
    </View>
  );
};

export default AnimatedSpinner;
