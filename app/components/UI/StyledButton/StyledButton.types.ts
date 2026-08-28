import { ReactNode } from 'react';
import {
  AccessibilityRole,
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

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
   * Style of the childGroup view
   */
  childGroupStyle?: StyleProp<ViewStyle>;
  /**
   * Font Scaling
   */
  allowFontScaling?: boolean;
  /**
   * Accessibility flag
   */
  accessible?: boolean;
  /**
   * Accessibility role
   */
  accessibilityRole?: AccessibilityRole;
}
