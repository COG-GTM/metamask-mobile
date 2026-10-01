import React from 'react';
import { StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';

interface GenericButtonProps {
  /**
   * Children components of the GenericButton
   * it can be a text node, an image, or an icon
   * or an Array with a combination of them
   */
  children?: React.ReactNode;
  /**
   * Styles to be applied to the GenericButton
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Function to be called on press
   */
  onPress?: (event: GestureResponderEvent) => void;
}

declare const GenericButton: React.FC<GenericButtonProps>;

export default GenericButton;
