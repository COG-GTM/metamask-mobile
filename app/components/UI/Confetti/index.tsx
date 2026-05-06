import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ConfettiNormal: React.ComponentType<
  Record<string, unknown> & { ref?: React.Ref<ConfettiNormalInstance> }
> = require('react-native-confetti').default;
import ConfettiCannon from 'react-native-confetti-cannon';

interface ConfettiNormalInstance {
  startConfetti: () => void;
  stopConfetti?: () => void;
}

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

type Props = Record<string, unknown>;

const Confetti = (props: Props) => {
  const confettiViewRef = useRef<ConfettiNormalInstance | null>(null);

  useEffect(() => {
    if (isAndroid && confettiViewRef.current) {
      confettiViewRef.current.startConfetti();
    }
  }, []);

  return isAndroid ? (
    <ConfettiNormal
      ref={(node: ConfettiNormalInstance | null) => {
        confettiViewRef.current = node;
      }}
      {...props}
    />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
