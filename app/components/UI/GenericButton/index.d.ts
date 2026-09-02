import React from 'react';
import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

/**
 * Type declaration for the platform specific implementations of GenericButton
 * (`index.ios.tsx` and `index.android.tsx`), which TypeScript cannot resolve
 * from the directory import.
 */
interface GenericButtonProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
}

declare const GenericButton: React.FC<GenericButtonProps>;

export default GenericButton;
