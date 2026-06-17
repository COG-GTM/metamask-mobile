import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
import ConfettiNormal from 'react-native-confetti';
import ConfettiCannon, {
  ExplosionProps,
} from 'react-native-confetti-cannon';

interface ConfettiNormalInstance {
  startConfetti: () => void;
  stopConfetti?: () => void;
}

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

const Confetti = (props: Partial<ExplosionProps>) => {
  let confettiView: ConfettiNormalInstance | false = false;

  useEffect(() => {
    if (isAndroid && confettiView) {
      confettiView.startConfetti();
    }
  }, [confettiView]);

  return isAndroid ? (
    <ConfettiNormal
      ref={(node: ConfettiNormalInstance) => (confettiView = node)}
      {...props}
    />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
