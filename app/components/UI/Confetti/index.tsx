import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
import ConfettiNormal from 'react-native-confetti';
// eslint-disable-next-line import/no-named-as-default-member -- the package ships ES source the import plugin cannot parse
import ConfettiCannon from 'react-native-confetti-cannon';

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

type ConfettiProps = Omit<
  Partial<React.ComponentProps<typeof ConfettiCannon>>,
  'count' | 'origin'
>;

const Confetti = (props: ConfettiProps) => {
  let confettiView: ConfettiNormal | null | false = false;

  useEffect(() => {
    if (isAndroid && confettiView) {
      confettiView.startConfetti();
    }
  }, [confettiView]);

  return isAndroid ? (
    <ConfettiNormal ref={(node) => (confettiView = node)} {...props} />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
