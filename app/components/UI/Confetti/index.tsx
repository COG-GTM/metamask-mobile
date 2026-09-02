import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
import ConfettiNormal from 'react-native-confetti';
import ConfettiCannon, { ExplosionProps } from 'react-native-confetti-cannon';

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

interface ConfettiNormalRef {
  startConfetti: () => void;
}

type ConfettiProps = Partial<ExplosionProps>;

const Confetti = (props: ConfettiProps) => {
  let confettiView: ConfettiNormalRef | false | null = false;

  useEffect(() => {
    if (isAndroid && confettiView) {
      confettiView.startConfetti();
    }
  }, [confettiView]);

  return isAndroid ? (
    <ConfettiNormal
      ref={(node: ConfettiNormalRef | null) => (confettiView = node)}
      {...props}
    />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
