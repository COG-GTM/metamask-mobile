import React from 'react';
import { StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';

interface GenericButtonProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
}

declare const GenericButton: React.FC<GenericButtonProps>;
export default GenericButton;
