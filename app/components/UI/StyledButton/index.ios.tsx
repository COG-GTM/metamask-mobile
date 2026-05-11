import React, { PureComponent, ReactNode } from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import Button from '@metamask/react-native-button';
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
}

/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 */
export default class StyledButton extends PureComponent<StyledButtonProps> {
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
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
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

(
  StyledButton as unknown as { contextType: typeof ThemeContext }
).contextType = ThemeContext;
