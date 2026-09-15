declare module '@metamask/react-native-button' {
  import { Component, ReactNode } from 'react';
  import {
    StyleProp,
    TextStyle,
    TouchableOpacityProps,
    ViewStyle,
  } from 'react-native';

  export interface ButtonProps extends TouchableOpacityProps {
    children?: ReactNode;
    accessibilityLabel?: string;
    allowFontScaling?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    disabledContainerStyle?: StyleProp<ViewStyle>;
    disabled?: boolean;
    style?: StyleProp<TextStyle>;
    styleDisabled?: StyleProp<TextStyle>;
    childGroupStyle?: StyleProp<ViewStyle>;
  }

  export default class Button extends Component<ButtonProps> {}
}
