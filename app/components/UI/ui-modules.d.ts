// Ambient declarations for untyped JavaScript dependencies used by the
// components under `app/components/UI`. Declared here (rather than in
// `app/declarations/index.d.ts`) to keep the TypeScript migration of this
// directory self-contained.

declare module 'react-native-progress/Bar' {
  import { ComponentType } from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  interface ProgressBarProps {
    progress?: number;
    width?: number | null;
    height?: number;
    color?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    useNativeDriver?: boolean;
    style?: StyleProp<ViewStyle>;
  }

  const ProgressBar: ComponentType<ProgressBarProps>;
  export default ProgressBar;
}

declare module 'react-native/Libraries/Utilities/dismissKeyboard' {
  const dismissKeyboard: () => void;
  export default dismissKeyboard;
}

declare module 'react-native-confetti';

declare module '@metamask/react-native-button';

declare module '@metamask/react-native-button/coalesceNonElementChildren' {
  const coalesceNonElementChildren: (
    children: React.ReactNode,
    mapper: (children: React.ReactNode[], index: number) => React.ReactNode,
  ) => React.ReactNode[];
  export default coalesceNonElementChildren;
}
