import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import ConfettiNormal from 'react-native-confetti';
import ConfettiCannon, { ExplosionProps } from 'react-native-confetti-cannon';
import Device from '../../../util/device';

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

type ConfettiProps = Partial<ExplosionProps>;

const Confetti = (props: ConfettiProps) => {
  let confettiView: ConfettiNormal | null = null;

  useEffect(() => {
    if (isAndroid && confettiView) {
      confettiView.startConfetti();
    }
  }, [confettiView]);

  return isAndroid ? (
    <ConfettiNormal
      ref={(node) => {
        confettiView = node;
      }}
      {...props}
    />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
