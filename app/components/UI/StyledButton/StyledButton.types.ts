import React from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface StyledButtonProps {
  children?: React.ReactNode;
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
