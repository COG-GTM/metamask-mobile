import React from 'react';
import Button from '@metamask/react-native-button';
import getStyles from './styledButtonStyles';
import { useTheme } from '../../../util/theme';
import { StyledButtonProps } from './StyledButton.types';

/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 * Please update your code to use the new `<Button>` component instead, which can be found at app/component-library/components/Buttons/Button/Button.tsx.
 * You can find documentation for the new Button component in the README:
 * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Buttons/Button/README.md}
 * If you would like to help with the replacement of the old `Button` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-mobile/issues/8106}
 */
const StyledButton = ({
  type,
  onPress,
  onPressOut,
  style,
  children,
  disabled,
  styleDisabled = { opacity: 0.6 },
  testID,
  disabledContainerStyle = { opacity: 0.6 },
  containerStyle,
}: StyledButtonProps) => {
  const { colors } = useTheme();
  const { fontStyle, containerStyle: typeContainerStyle } = getStyles(
    type,
    colors,
  );

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
      containerStyle={[...typeContainerStyle, containerStyle]}
    >
      {children}
    </Button>
  );
};

export default StyledButton;
