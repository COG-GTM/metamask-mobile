import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
// @ts-expect-error -- legacy JavaScript UI type boundary
import ConfettiNormal from 'react-native-confetti';
import ConfettiCannon from 'react-native-confetti-cannon';

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

// @ts-expect-error -- legacy JavaScript UI type boundary
const Confetti = (props) => {
  let confettiView = false;

  useEffect(() => {
    if (isAndroid && confettiView) {
// @ts-expect-error -- legacy JavaScript UI type boundary
      confettiView.startConfetti();
    }
  }, [confettiView]);

  return isAndroid ? (
// @ts-expect-error -- legacy JavaScript UI type boundary
    <ConfettiNormal ref={(node) => (confettiView = node)} {...props} />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
