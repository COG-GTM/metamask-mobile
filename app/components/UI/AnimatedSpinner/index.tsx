import React, { PureComponent } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeColors } from '@metamask/design-tokens';
import { Theme } from '../../../util/theme/models';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';

export const SpinnerSize = {
  MD: 'MD',
  SM: 'SM',
} as const;

const measures = {
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

type SpinnerSizeType = keyof typeof measures;

type SpinnerMeasures = (typeof measures)[SpinnerSizeType];

interface AnimatedSpinnerProps {
  /**
   * Size of the spinner
   */
  size?: SpinnerSizeType;
  /**
   * Test ID for the spinner
   */
  testID?: string;
}

interface AnimatedSpinnerState {
  spinning: boolean;
}

const createStyles = (colors: ThemeColors, spinnerMeasures: SpinnerMeasures) =>
  StyleSheet.create({
    view: {
      position: 'relative',
      height: Device.isAndroid()
        ? spinnerMeasures.Android.height
        : spinnerMeasures.iOS.height,
      width: Device.isAndroid() ? spinnerMeasures.Android.width : spinnerMeasures.iOS.width,
      top: Device.isAndroid() ? -6 : -5.5,
      left: Device.isAndroid() ? -6 : -5.5,
    },
    static: {
      borderWidth: 3.5,
      borderColor: colors.background.alternative,
      borderRadius: spinnerMeasures.static.borderRadius,
      width: spinnerMeasures.static.width,
      height: spinnerMeasures.static.height,
    },
  });

/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging --
 * Declaration merging types `this.context` as the app theme without emitting a
 * class field, which Babel would turn into an own property that shadows the
 * `context` React assigns from `contextType`.
 */
interface AnimatedSpinner {
  context: Theme;
}

class AnimatedSpinner extends PureComponent<
  AnimatedSpinnerProps,
  AnimatedSpinnerState
> {
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
    const colors = this.context.colors || mockTheme.colors;
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

AnimatedSpinner.contextType = ThemeContext;

export default AnimatedSpinner;
