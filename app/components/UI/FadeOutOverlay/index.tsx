import React, { PureComponent } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';
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

interface State {
  done: boolean;
}

/**
 * View that is displayed to first time (new) users
 */
export default class FadeOutOverlay extends PureComponent<Props, State> {
  static contextType = ThemeContext;

  static defaultProps: Partial<Props> = {
    style: null,
    duration: Device.isAndroid() ? 300 : 300,
  };

  state: State = {
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
      (this.context as { colors?: Colors } | undefined)?.colors ||
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
