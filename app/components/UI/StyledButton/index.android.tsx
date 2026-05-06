import React, { PureComponent, ReactNode } from 'react';
import {
  Text,
  View,
  TouchableNativeFeedback,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import coalesceNonElementChildren from '@metamask/react-native-button/coalesceNonElementChildren';
import getStyles from './styledButtonStyles';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface Props {
  /**
   * Children components of the Button
   * it can be a text node, an image, or an icon
   * or an Array with a combination of them
   */
  children?: ReactNode;
  /**
   * Disable the button
   */
  disabled?: boolean;
  /**
   * Styles to be applied to the Button Text
   */
  style?: StyleProp<TextStyle>;
  /**
   * Styles to be applied to the Button disabled state text
   */
  styleDisabled?: StyleProp<TextStyle>;
  /**
   * Styles to be applied to the Button disabled container
   */
  disabledContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Styles to be applied to the Button Container
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Function to be called on press
   */
  onPress?: () => void;
  /**
   * Function to be called on press out
   */
  onPressOut?: () => void;
  /**
   * Type of the button
   */
  type?: string;
  /**
   * ID of the element to be used on e2e tests
   */
  testID?: string;
  /**
   * Style of the childGroup view
   */
  childGroupStyle?: StyleProp<ViewStyle>;
  /**
   * Font Scaling
   */
  allowFontScaling?: boolean;
}

interface TouchableProps {
  onPress?: () => void;
  onPressOut?: () => void;
}

/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 * Please update your code to use the new `<Button>` component instead, which can be found at app/component-library/components/Buttons/Button/Button.tsx.
 * You can find documentation for the new Button component in the README:
 * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Buttons/Button/README.md}
 * If you would like to help with the replacement of the old `Button` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-mobile/issues/8106}
 */
export default class StyledButton extends PureComponent<Props> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  static defaultProps: Partial<Props> = {
    styleDisabled: { opacity: 0.6 },
    disabledContainerStyle: { opacity: 0.6 },
  };

  renderGroupedChildren = (fontStyle: StyleProp<TextStyle>[]) => {
    const { disabled } = this.props;
    const style: StyleProp<TextStyle>[] = [
      ...fontStyle,
      this.props.style,
      disabled ? this.props.styleDisabled : null,
    ];

    const childGroupStyle = [this.props.childGroupStyle];

    const children = coalesceNonElementChildren(
      this.props.children,
      (groupedChildren: ReactNode, index: number) => (
        <Text
          key={index}
          style={style}
          allowFontScaling={this.props.allowFontScaling}
        >
          {groupedChildren}
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
    const colors = this.context?.colors || mockTheme.colors;
    const { fontStyle, containerStyle } = getStyles(type ?? 'normal', colors);
    const touchableProps: TouchableProps = {};
    const containerStyles: StyleProp<ViewStyle>[] = [
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
