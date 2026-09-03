import type { SharedValue } from 'react-native-reanimated';

export interface CurrentNotification {
  id?: string;
  type?: string;
  status?: string;
  title?: string;
  description?: string;
  isVisible?: boolean;
  autodismiss?: number;
  transaction?: { id: string; [key: string]: unknown };
  [key: string]: unknown;
}

export type AnimatedTimingStart = (
  animatedRef: SharedValue<number>,
  toValue: number,
  callback?: () => void,
) => void;
