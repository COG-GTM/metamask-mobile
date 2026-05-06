/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent, ReactNode } from 'react';
import {
  Text,
  View,
  TouchableNativeFeedback,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
// @ts-expect-error - no types for @metamask/react-native-button helper
import coalesceNonElementChildren from '@metamask/react-native-button/coalesceNonElementChildren';
import getStyles from './styledButtonStyles';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface Props {
  children?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<TextStyle>;
  styleDisabled?: StyleProp<TextStyle>;
  disabledContainerStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onPressOut?: () => void;
  type?: string;
  testID?: string;
  childGroupStyle?: StyleProp<ViewStyle>;
  allowFontScaling?: boolean;
}

/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 */
export default class StyledButton extends PureComponent<Props> {
  declare context: any;
  static contextType = ThemeContext;

  static defaultProps = {
    styleDisabled: { opacity: 0.6 },
    disabledContainerStyle: { opacity: 0.6 },
  };

  renderGroupedChildren = (fontStyle: any) => {
    const { disabled } = this.props;
    const style = [
      ...fontStyle,
      this.props.style,
      disabled ? this.props.styleDisabled : null,
    ];

    const childGroupStyle = [this.props.childGroupStyle];

    const children = coalesceNonElementChildren(
      this.props.children,
      (children: ReactNode, index: number) => (
        <Text
          key={index}
          style={style}
          allowFontScaling={this.props.allowFontScaling}
        >
          {children}
        </Text>
      ),
    );

    switch (children.length) {
      case 0:
        return null;
      case 1:
        return children[0];
      default:
        return <View style={childGroupStyle}>{children}</View>;
    }
  };

  render = () => {
    const { type } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const { fontStyle, containerStyle } = getStyles(type as string, colors);
    const touchableProps: any = {};
    const containerStyles = [
      ...containerStyle,
      this.props.disabled ? this.props.disabledContainerStyle : null,
      this.props.containerStyle,
    ];

    if (!this.props.disabled) {
      touchableProps.onPress = this.props.onPress;
      touchableProps.onPressOut = this.props.onPressOut;
    }

    return (
      <TouchableNativeFeedback
        {...touchableProps}
        disabled={this.props.disabled}
        accessible
        accessibilityLabel={this.props.testID}
        accessibilityRole="button"
      >
        <View style={containerStyles}>
          {this.renderGroupedChildren(fontStyle)}
        </View>
      </TouchableNativeFeedback>
    );
  };
}
