import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
import ConfettiNormal from 'react-native-confetti';
// eslint-disable-next-line import/no-named-as-default-member
import ConfettiCannon, { ExplosionProps } from 'react-native-confetti-cannon';

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

const Confetti = (props: Partial<ExplosionProps>) => {
  let confettiView: { startConfetti: () => void } | null = null;

  useEffect(() => {
    if (isAndroid && confettiView) {
      confettiView.startConfetti();
    }
  }, [confettiView]);

  return isAndroid ? (
    <ConfettiNormal
      ref={(node: { startConfetti: () => void } | null) => (confettiView = node)}
      {...props}
    />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
