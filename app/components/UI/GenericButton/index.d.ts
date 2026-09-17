import React from 'react';
import { StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';

/**
 * Type declaration for the platform-specific GenericButton component
 * (see index.ios.tsx / index.android.tsx). This allows the module to be
 * resolved by `tsc` when imported without a platform suffix; Metro resolves
 * the concrete platform implementation at runtime.
 */
interface GenericButtonProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
}

declare const GenericButton: React.FC<GenericButtonProps>;

export default GenericButton;
