import React, { useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
import ConfettiNormal from 'react-native-confetti';
import ConfettiCannon from 'react-native-confetti-cannon';

const isAndroid = Platform.OS === 'android';
const ORIGIN: { x: number; y: number } = {
  x: Device.getDeviceWidth() / 2,
  y: 0,
};

interface ConfettiProps {
  [key: string]: unknown;
}

const Confetti = (props: ConfettiProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const confettiView = useRef<any>(null);

  useEffect(() => {
    if (isAndroid && confettiView.current) {
      confettiView.current.startConfetti();
    }
  }, []);

  return isAndroid ? (
    <ConfettiNormal ref={confettiView} {...props} />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
