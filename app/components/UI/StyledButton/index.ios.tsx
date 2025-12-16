import React, { PureComponent, ReactNode } from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import Button from '@metamask/react-native-button';
import getStyles from './styledButtonStyles';
import { ThemeContext, mockTheme } from '../../../util/theme';

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
}

/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 * Please update your code to use the new `<Button>` component instead, which can be found at app/component-library/components/Buttons/Button/Button.tsx.
 * You can find documentation for the new Button component in the README:
 * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Buttons/Button/README.md}
 * If you would like to help with the replacement of the old `Button` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-mobile/issues/8106}
 */
export default class StyledButton extends PureComponent<StyledButtonProps> {
  declare context: React.ContextType<typeof ThemeContext>;

  static defaultProps = {
    styleDisabled: { opacity: 0.6 },
    disabledContainerStyle: { opacity: 0.6 },
  };

  render = () => {
    const {
      type,
      onPress,
      onPressOut,
      style,
      children,
      disabled,
      styleDisabled,
      testID,
      disabledContainerStyle,
    } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const { fontStyle, containerStyle } = getStyles(type, colors);

    return (
      <Button
        testID={testID}
        accessibilityRole="button"
        disabled={disabled}
        styleDisabled={disabled ? styleDisabled : null}
        disabledContainerStyle={disabled ? disabledContainerStyle : null}
        onPress={onPress}
        onPressOut={onPressOut}
        style={[...fontStyle, style]}
        containerStyle={[...containerStyle, this.props.containerStyle]}
      >
        {children}
      </Button>
    );
  };
}

StyledButton.contextType = ThemeContext;
