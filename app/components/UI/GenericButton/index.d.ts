import React from 'react';
import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

interface GenericButtonProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
}

declare const GenericButton: React.ComponentType<GenericButtonProps>;

export default GenericButton;
