// Type-only module declaration: `GenericButton` only ships platform specific
// implementations (`index.ios.tsx` / `index.android.tsx`), which TypeScript's
// module resolution does not understand. This declaration lets TypeScript
// resolve `../GenericButton` imports and has no runtime effect.
import React from 'react';
import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

interface GenericButtonProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
}

declare const GenericButton: React.FC<GenericButtonProps>;

export default GenericButton;
