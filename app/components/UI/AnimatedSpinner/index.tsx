import React, { PureComponent } from 'react';
import { View, Animated, Easing, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '@metamask/design-tokens';

export enum SpinnerSize {
  MD = 'MD',
  SM = 'SM',
}

interface MeasuresType {
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

const measures: Record<SpinnerSize, MeasuresType> = {
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

const createStyles = (colors: Theme['colors'], measuresForSize: MeasuresType) =>
  StyleSheet.create({
    view: {
      position: 'relative',
      height: Device.isAndroid()
        ? measuresForSize.Android.height
        : measuresForSize.iOS.height,
      width: Device.isAndroid()
        ? measuresForSize.Android.width
        : measuresForSize.iOS.width,
      top: Device.isAndroid() ? -6 : -5.5,
      left: Device.isAndroid() ? -6 : -5.5,
    },
    static: {
      borderWidth: 3.5,
      borderColor: colors.background.alternative,
      borderRadius: measuresForSize.static.borderRadius,
      width: measuresForSize.static.width,
      height: measuresForSize.static.height,
    },
  });

interface AnimatedSpinnerProps {
  size?: SpinnerSize;
  style?: StyleProp<ViewStyle>;
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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  context: React.ContextType<typeof ThemeContext> = undefined!;

  spinValue = new Animated.Value(0);

  state: AnimatedSpinnerState = {
    spinning: false,
  };

  mounted?: boolean;

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
    const { size = SpinnerSize.MD, style, testID } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors, measures[size]);
    const spin = this.spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={[styles.static, style]} testID={testID}>
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
