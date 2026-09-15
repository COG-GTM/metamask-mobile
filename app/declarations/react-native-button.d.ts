declare module '@metamask/react-native-button' {
  import { Component, ReactNode } from 'react';
  import {
    StyleProp,
    TextStyle,
    TouchableOpacityProps,
    ViewStyle,
  } from 'react-native';

  export interface ButtonProps extends TouchableOpacityProps {
    accessibilityLabel?: string;
    allowFontScaling?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    disabledContainerStyle?: StyleProp<ViewStyle>;
    disabled?: boolean;
    style?: StyleProp<TextStyle>;
    styleDisabled?: StyleProp<TextStyle>;
    childGroupStyle?: StyleProp<ViewStyle>;
    children?: ReactNode;
  }

  export default class Button extends Component<ButtonProps> {}
}
