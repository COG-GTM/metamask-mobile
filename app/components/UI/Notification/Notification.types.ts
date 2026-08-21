import { SharedValue } from 'react-native-reanimated';

export interface CurrentNotification {
  id?: string;
  type?: string;
  isVisible?: boolean;
  autodismiss?: number;
  status?: string;
  title?: string;
  description?: string;
  transaction?: {
    id?: string;
    nonce?: string;
    amount?: string;
    assetType?: string;
  };
}

export type AnimatedTimingStart = (
  animatedRef: SharedValue<number>,
  toValue: number,
  callback?: () => void,
) => void;
