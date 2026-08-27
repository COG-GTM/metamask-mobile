/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface FadeOutOverlayProps {
  style?: any;
  duration?: number;
}

const createStyles = (colors: any): any =>
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
export default class FadeOutOverlay extends PureComponent<FadeOutOverlayProps> {

  static defaultProps = {
    style: null,
    duration: Device.isAndroid() ? 300 : 300,
  };

  state = {
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
    const colors =
      (this.context as React.ContextType<typeof ThemeContext>).colors ||
      mockTheme.colors;
    const styles = createStyles(colors);

    if (this.state.done) return null;
    return (
      <Animated.View
        style={[{ opacity: this.opacity }, styles.view, this.props.style]}
      />
    );
  }
}

FadeOutOverlay.contextType = ThemeContext;
