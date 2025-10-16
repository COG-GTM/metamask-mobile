import React, { PureComponent } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';
import type { Theme } from '../../../util/theme/models';

const createStyles = (colors: { background: { default: string } }) =>
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

interface FadeOutOverlayProps {
  style?: ViewStyle;
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
    style: undefined,
    duration: Device.isAndroid() ? 300 : 300,
  };

  state: FadeOutOverlayState = {
    done: false,
  };

  opacity = new Animated.Value(1);

  componentDidMount() {
    Animated.timing(this.opacity, {
      toValue: 0,
      duration: this.props.duration,
      useNativeDriver: true,
      isInteraction: false,
    }).start(() => {
      this.setState({ done: true });
    });
  }

  render() {
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (this.state.done) return null;
    return (
      <Animated.View
        style={[{ opacity: this.opacity }, styles.view, this.props.style]}
      />
    );
  }
}
