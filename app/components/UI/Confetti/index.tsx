import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
import ConfettiNormal from 'react-native-confetti';
import ConfettiCannon from 'react-native-confetti-cannon';

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

const Confetti = () => {
  const confettiRef = useRef<ConfettiNormal | null>(null);

  useEffect(() => {
    if (isAndroid && confettiRef.current) {
      confettiRef.current.startConfetti();
    }
  }, []);

  return isAndroid ? (
    <ConfettiNormal ref={confettiRef} />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} />
  );
};

export default Confetti;
