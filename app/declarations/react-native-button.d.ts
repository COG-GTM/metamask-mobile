declare module '@metamask/react-native-button' {
  import { Component, ReactNode } from 'react';
  import {
    StyleProp,
    TextStyle,
    TouchableOpacityProps,
    ViewStyle,
  } from 'react-native';

  export interface ButtonProps extends TouchableOpacityProps {
    allowFontScaling?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    disabledContainerStyle?: StyleProp<ViewStyle>;
    childGroupStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<TextStyle>;
    styleDisabled?: StyleProp<TextStyle>;
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
