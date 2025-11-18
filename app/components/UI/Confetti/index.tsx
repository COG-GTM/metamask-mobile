import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
// @ts-ignore - no type definitions available
import ConfettiNormal from 'react-native-confetti';
import ConfettiCannon from 'react-native-confetti-cannon';

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

interface ConfettiProps {
  [key: string]: unknown;
}

const Confetti = (props: ConfettiProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let confettiView: any = null;

  useEffect(() => {
    if (isAndroid && confettiView) {
      confettiView.startConfetti();
    }
  }, [confettiView]);

  return isAndroid ? (
    <ConfettiNormal ref={(node: unknown) => (confettiView = node)} {...props} />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
