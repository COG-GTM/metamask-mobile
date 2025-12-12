import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
// @ts-expect-error - react-native-confetti does not have type declarations
import ConfettiNormal from 'react-native-confetti';
import ConfettiCannon from 'react-native-confetti-cannon';

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

interface ConfettiProps {
  [key: string]: unknown;
}

interface ConfettiNormalRef {
  startConfetti: () => void;
}

const Confetti = (props: ConfettiProps) => {
  const confettiRef = useRef<ConfettiNormalRef | null>(null);

  useEffect(() => {
    if (isAndroid && confettiRef.current) {
      confettiRef.current.startConfetti();
    }
  }, []);

  return isAndroid ? (
    <ConfettiNormal ref={confettiRef} {...props} />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
