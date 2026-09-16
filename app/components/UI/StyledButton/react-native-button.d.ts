declare module '@metamask/react-native-button' {
  import { Component, ReactNode } from 'react';
  import { StyleProp, TextStyle, ViewStyle } from 'react-native';

  export interface ButtonProps {
    accessibilityLabel?: string;
    accessibilityRole?: string;
    allowFontScaling?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    disabledContainerStyle?: StyleProp<ViewStyle>;
    disabled?: boolean;
    style?: StyleProp<TextStyle>;
    styleDisabled?: StyleProp<TextStyle>;
    childGroupStyle?: StyleProp<ViewStyle>;
    onPress?: () => void;
    onPressIn?: () => void;
    onPressOut?: () => void;
    onLongPress?: () => void;
    delayPressIn?: number;
    delayPressOut?: number;
    delayLongPress?: number;
    testID?: string;
    children?: ReactNode;
  }

  export default class Button extends Component<ButtonProps> {}
}

declare module '@metamask/react-native-button/coalesceNonElementChildren' {
  export default function coalesceNonElementChildren(
    children: import('react').ReactNode,
    coalesceNodes: (
      children: import('react').ReactNode[],
      index: number,
    ) => import('react').ReactNode,
  ): import('react').ReactNode[];
}
