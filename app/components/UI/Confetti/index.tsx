import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Device from '../../../util/device';
import ConfettiNormal from 'react-native-confetti';
import ConfettiCannon from 'react-native-confetti-cannon';

const isAndroid = Platform.OS === 'android';
const ORIGIN = { x: Device.getDeviceWidth() / 2, y: 0 };

interface ConfettiProps {
  [prop: string]: unknown;
}

interface ConfettiNormalHandle {
  startConfetti?: () => void;
}

const Confetti = (props: ConfettiProps) => {
  const confettiViewRef = useRef<ConfettiNormalHandle | null>(null);

  useEffect(() => {
    if (isAndroid && confettiViewRef.current?.startConfetti) {
      confettiViewRef.current.startConfetti();
    }
  }, []);

  return isAndroid ? (
    <ConfettiNormal
      ref={(node: ConfettiNormalHandle | null) => {
        confettiViewRef.current = node;
      }}
      {...props}
    />
  ) : (
    <ConfettiCannon fadeOut count={300} origin={ORIGIN} {...props} />
  );
};

export default Confetti;
