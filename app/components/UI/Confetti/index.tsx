import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
// @ts-expect-error - no type definitions available
import ConfettiNormal from 'react-native-confetti';
import ConfettiCannon from 'react-native-confetti-cannon';

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

const Confetti: React.FC<Record<string, unknown>> = (props) => {
  let confettiView: { startConfetti: () => void } | null = null;

  useEffect(() => {
    if (isAndroid && confettiView) {
      confettiView.startConfetti();
    }
  }, [confettiView]);

  return isAndroid ? (
    <ConfettiNormal ref={(node: { startConfetti: () => void } | null) => (confettiView = node)} {...props} />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
