import { ReactNode } from 'react';
import {
  AccessibilityRole,
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
// Platform-specific implementations live in index.ios / index.android; metro
// resolves those first, so this module is only used for type resolution.
import StyledButton from './index.ios';

export interface StyledButtonProps {
  /**
   * Children components of the Button
   * it can be a text node, an image, or an icon
   * or an Array with a combination of them
   */
  children?: ReactNode;
  /**
   * Type of the button
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
  onPress?: (event: GestureResponderEvent) => void;
  /**
   * Function to be called on press out
   */
  onPressOut?: (event: GestureResponderEvent) => void;
  /**
   * Type of the button
   */
  type: string;
  /**
   * ID of the element to be used on e2e tests
   */
  testID?: string;
  /**
   * Style of the childGroup view (Android only)
   */
  childGroupStyle?: StyleProp<ViewStyle>;
  /**
   * Font Scaling (Android only)
   */
  allowFontScaling?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessible?: boolean;
}

/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 * Please update your code to use the new `<Button>` component instead, which can be found at app/component-library/components/Buttons/Button/Button.tsx.
 * You can find documentation for the new Button component in the README:
 * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Buttons/Button/README.md}
 * If you would like to help with the replacement of the old `Button` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-mobile/issues/8106}
 */
export default StyledButton;
