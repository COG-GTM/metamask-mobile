import React, { PureComponent } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { Theme } from '@metamask/design-tokens';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';

export const SpinnerSize = {
  MD: 'MD',
  SM: 'SM',
} as const;

export type SpinnerSizeType = (typeof SpinnerSize)[keyof typeof SpinnerSize];

interface PlatformMeasure {
  height: number;
  width: number;
}

interface StaticMeasure {
  borderRadius: number;
  width: number;
  height: number;
  iconSize: number;
}

interface SpinnerMeasure {
  Android: PlatformMeasure;
  iOS: PlatformMeasure;
  static: StaticMeasure;
}

const measures: Record<SpinnerSizeType, SpinnerMeasure> = {
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

const createStyles = (colors: Theme['colors'], measure: SpinnerMeasure) =>
  StyleSheet.create({
    view: {
      position: 'relative',
      height: Device.isAndroid()
        ? measure.Android.height
        : measure.iOS.height,
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

interface AnimatedSpinnerProps {
  size?: SpinnerSizeType;
  testID?: string;
}

interface AnimatedSpinnerState {
  spinning: boolean;
}

export default class AnimatedSpinner extends PureComponent<
  AnimatedSpinnerProps,
  AnimatedSpinnerState
> {
  static contextType = ThemeContext;

  spinValue = new Animated.Value(0);

  mounted = false;

  state: AnimatedSpinnerState = {
    spinning: false,
  };

  componentDidMount() {
    this.mounted = true;
    this.spin();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  spin = () => {
    this.spinValue.setValue(0);

    if (this.state.spinning === false) {
      this.setState({ spinning: true });
      this.animation();
    } else {
      this.setState({ spinning: false });
    }
  };

  animation = () => {
    this.spinValue.setValue(0);

    Animated.timing(this.spinValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    }).start(() => {
      if (this.state.spinning && this.mounted) {
        this.animation();
      } else {
        this.mounted && this.setState({ spinning: false });
      }
    });
  };

  render() {
    const { size = SpinnerSize.MD } = this.props;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors, measures[size]);
    const spin = this.spinValue.interpolate({
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
  }
}
