import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
import ConfettiNormal from 'react-native-confetti';
import ConfettiCannon from 'react-native-confetti-cannon';

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

interface ConfettiProps {
  [key: string]: unknown;
}

const Confetti = (props: ConfettiProps) => {
  let confettiView: ConfettiNormal | null = null;

  useEffect(() => {
    if (isAndroid && confettiView) {
      confettiView.startConfetti();
    }
  }, [confettiView]);

  return isAndroid ? (
    <ConfettiNormal ref={(node: ConfettiNormal | null) => (confettiView = node)} {...props} />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
