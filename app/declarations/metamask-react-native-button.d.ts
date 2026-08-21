declare module '@metamask/react-native-button' {
  import { ComponentType, ReactNode } from 'react';
  import {
    StyleProp,
    TextStyle,
    TouchableOpacityProps,
    ViewStyle,
  } from 'react-native';

  interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
    children?: ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    disabledContainerStyle?: StyleProp<ViewStyle>;
    childGroupStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<TextStyle>;
    styleDisabled?: StyleProp<TextStyle>;
    allowFontScaling?: boolean;
  }

  const Button: ComponentType<ButtonProps>;

  export default Button;
}
