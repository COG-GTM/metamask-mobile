import React, { PureComponent, ReactNode } from 'react';
import {
  Text,
  View,
  TouchableNativeFeedback,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import coalesceNonElementChildren from '@metamask/react-native-button/coalesceNonElementChildren';
import getStyles from './styledButtonStyles';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '@metamask/design-tokens';

interface StyledButtonProps {
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

interface TouchableProps {
  onPress?: () => void;
  onPressOut?: () => void;
}

/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 */
export default class StyledButton extends PureComponent<StyledButtonProps> {
  static defaultProps = {
    styleDisabled: { opacity: 0.6 },
    disabledContainerStyle: { opacity: 0.6 },
  };

  renderGroupedChildren = (fontStyle: StyleProp<TextStyle>[]) => {
    const { disabled } = this.props;
    const style = [
      ...fontStyle,
      this.props.style,
      disabled ? this.props.styleDisabled : null,
    ];

    const childGroupStyle = [this.props.childGroupStyle];

    const children = coalesceNonElementChildren(
      this.props.children,
      ((groupedChildren: ReactNode, index: number) => (
        <Text
          key={index}
          style={style}
          allowFontScaling={this.props.allowFontScaling}
        >
          {groupedChildren}
        </Text>
      )) as unknown as (children: ReactNode[]) => ReactNode,
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
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    const { fontStyle, containerStyle } = getStyles(type ?? '', colors);
    const touchableProps: TouchableProps = {};
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

(
  StyledButton as unknown as { contextType: typeof ThemeContext }
).contextType = ThemeContext;
