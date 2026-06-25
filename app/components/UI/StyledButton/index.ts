import React from 'react';
import {
  AccessibilityRole,
  StyleProp,
  TextStyle,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
// Platform-specific implementations (index.ios.tsx / index.android.tsx) are
// resolved by the bundler. This module provides the shared type and a default
// re-export for the deprecated component.
import StyledButtonComponent from './index.ios';

export interface StyledButtonProps {
  children?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<TextStyle>;
  styleDisabled?: StyleProp<TextStyle>;
  disabledContainerStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  type?: string;
  testID?: string;
  childGroupStyle?: StyleProp<ViewStyle>;
  allowFontScaling?: boolean;
  accessible?: boolean;
  accessibilityRole?: AccessibilityRole;
}

/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 * Please update your code to use the new `<Button>` component instead, which can be found at app/component-library/components/Buttons/Button/Button.tsx.
 * You can find documentation for the new Button component in the README:
 * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Buttons/Button/README.md}
 * If you would like to help with the replacement of the old `Button` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-mobile/issues/8106}
 */
const StyledButton =
  StyledButtonComponent as unknown as React.ComponentType<StyledButtonProps>;

export default StyledButton;
