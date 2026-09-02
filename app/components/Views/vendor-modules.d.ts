/**
 * Ambient declarations for untyped third party modules used by the views
 * in this directory.
 */
declare module '@metamask/react-native-button' {
  import { PressableProps, StyleProp, ViewStyle } from 'react-native';

  const Button: React.ComponentType<
    PressableProps & {
      style?: StyleProp<ViewStyle>;
      styleDisabled?: StyleProp<ViewStyle>;
      children?: React.ReactNode;
    }
  >;
  export default Button;
}

declare module 'zxcvbn' {
  interface ZXCVBNResult {
    score: 0 | 1 | 2 | 3 | 4;
    [key: string]: unknown;
  }
  const zxcvbn: (password: string, userInputs?: string[]) => ZXCVBNResult;
  export default zxcvbn;
}
