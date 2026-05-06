import React, { PureComponent } from 'react';
import {
  View,
  Animated,
  Easing,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';

export const SpinnerSize = {
  MD: 'MD',
  SM: 'SM',
} as const;

export type SpinnerSizeType = (typeof SpinnerSize)[keyof typeof SpinnerSize];

interface PlatformMeasures {
  height: number;
  width: number;
}

interface StaticMeasures {
  borderRadius: number;
  width: number;
  height: number;
  iconSize: number;
}

interface MeasuresEntry {
  Android: PlatformMeasures;
  iOS: PlatformMeasures;
  static: StaticMeasures;
}

const measures: Record<SpinnerSizeType, MeasuresEntry> = {
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

interface SpinnerStyles {
  view: ViewStyle;
  static: ViewStyle;
}

const createStyles = (colors: Colors, sizeMeasures: MeasuresEntry) =>
  StyleSheet.create<SpinnerStyles>({
    view: {
      position: 'relative',
      height: Device.isAndroid()
        ? sizeMeasures.Android.height
        : sizeMeasures.iOS.height,
      width: Device.isAndroid()
        ? sizeMeasures.Android.width
        : sizeMeasures.iOS.width,
      top: Device.isAndroid() ? -6 : -5.5,
      left: Device.isAndroid() ? -6 : -5.5,
    },
    static: {
      borderWidth: 3.5,
      borderColor: colors.background.alternative,
      borderRadius: sizeMeasures.static.borderRadius,
      width: sizeMeasures.static.width,
      height: sizeMeasures.static.height,
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

  state: AnimatedSpinnerState = {
    spinning: false,
  };

  mounted = false;

  declare context: React.ContextType<typeof ThemeContext>;

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
      } else if (this.mounted) {
        this.setState({ spinning: false });
      }
    });
  };

  render() {
    const { size = SpinnerSize.MD } = this.props;
    const colors: Colors = this.context?.colors || mockTheme.colors;
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
