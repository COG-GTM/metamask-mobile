import React, { PureComponent } from 'react';
import { Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '@metamask/design-tokens';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    overlay: {
      backgroundColor: colors.overlay.default,
    },
  });

interface FadeOutOverlayProps {
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

interface FadeOutOverlayState {
  done: boolean;
}

export default class FadeOutOverlay extends PureComponent<
  FadeOutOverlayProps,
  FadeOutOverlayState
> {
  static contextType = ThemeContext;
  static defaultProps = {
    style: null,
    duration: Device.isAndroid() ? 300 : 300,
  };

  declare context: React.ContextType<typeof ThemeContext>;
  opacity: Animated.Value;

  constructor(props: FadeOutOverlayProps) {
    super(props);
    this.state = {
      done: false,
    };
    this.opacity = new Animated.Value(1);
  }

  componentDidMount() {
    Animated.timing(this.opacity, {
      toValue: 0,
      duration: this.props.duration,
      useNativeDriver: true,
    }).start(() => {
      this.setState({ done: true });
    });
  }

  render() {
    if (this.state.done) return null;

    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <Animated.View
        style={[
          styles.overlay,
          this.props.style,
          {
            opacity: this.opacity,
          },
        ]}
      />
    );
  }
}
