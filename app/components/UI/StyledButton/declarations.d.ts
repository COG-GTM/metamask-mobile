declare module '@metamask/react-native-button' {
  import { ComponentType, ReactNode } from 'react';
  import {
    AccessibilityRole,
    GestureResponderEvent,
    StyleProp,
    TextStyle,
    ViewStyle,
  } from 'react-native';

  interface ButtonProps {
    accessibilityLabel?: string;
    accessibilityRole?: AccessibilityRole;
    allowFontScaling?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    childGroupStyle?: StyleProp<ViewStyle>;
    disabledContainerStyle?: StyleProp<ViewStyle>;
    disabled?: boolean;
    onPress?: (event: GestureResponderEvent) => void;
    onPressOut?: (event: GestureResponderEvent) => void;
    style?: StyleProp<TextStyle>;
    styleDisabled?: StyleProp<TextStyle>;
    testID?: string;
    children?: ReactNode;
  }

  const Button: ComponentType<ButtonProps>;
  export default Button;
}

declare module '@metamask/react-native-button/coalesceNonElementChildren' {
  const coalesceNonElementChildren: (
    children: import('react').ReactNode,
    coalesceNodes: (
      children: import('react').ReactNode,
      index: number,
    ) => import('react').ReactNode,
  ) => import('react').ReactNode[];
  export default coalesceNonElementChildren;
}
