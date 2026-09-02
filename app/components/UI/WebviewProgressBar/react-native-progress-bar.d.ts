declare module 'react-native-progress/Bar' {
  import { Component } from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  interface BarProps {
    animated?: boolean;
    indeterminate?: boolean;
    progress?: number;
    color?: string;
    unfilledColor?: string;
    borderWidth?: number;
    borderColor?: string;
    /**
     * Full width of the progress bar, set to null to use automatic flexbox sizing
     */
    width?: number | null;
    height?: number;
    borderRadius?: number;
    useNativeDriver?: boolean;
    animationConfig?: Record<string, unknown>;
    animationType?: 'decay' | 'timing' | 'spring';
    style?: StyleProp<ViewStyle>;
  }

  export default class Bar extends Component<BarProps> {}
}
