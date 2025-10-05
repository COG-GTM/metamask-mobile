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

const MEASURES = {
  [SpinnerSize.MD]: {
    size: 64,
    iconSize: 56,
  },
  [SpinnerSize.SM]: {
    size: 32,
    iconSize: 24,
  },
};

const createStyles = (colors: Theme['colors'], size: SpinnerSize) => {
  const measures = MEASURES[size];
  const androidCorrection = Device.isAndroid() ? 0 : 0;
  return StyleSheet.create({
    wrapper: {
      height: measures.size,
      width: measures.size,
      backgroundColor: colors.background.alternative,
      borderRadius: measures.size,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapper: {
      height: measures.iconSize - androidCorrection,
      width: measures.iconSize - androidCorrection,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};

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
  static defaultProps = {
    size: SpinnerSize.MD,
  };

  declare context: React.ContextType<typeof ThemeContext>;
  spinValue: Animated.Value;
  mounted?: boolean;

  constructor(props: AnimatedSpinnerProps) {
    super(props);
    this.state = {
      spinning: false,
    };
    this.spinValue = new Animated.Value(0);
  }

  componentDidMount() {
    this.mounted = true;
    this.spin();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  spin = () => {
    if (!this.mounted) return false;
    this.spinValue.setValue(0);
    this.setState({ spinning: true });
    Animated.timing(this.spinValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => this.spin());
  };

  render() {
    const colors = this.context.colors || mockTheme.colors;
    const size = this.props.size || SpinnerSize.MD;
    const styles = createStyles(colors, size);

    const spin = this.spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={[styles.wrapper, this.props.style]} testID={this.props.testID}>
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Icon
            name="loading"
            size={MEASURES[size].iconSize}
            color={colors.primary.default}
          />
        </Animated.View>
      </View>
    );
  }
}
