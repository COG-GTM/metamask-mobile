import { useState, useEffect } from 'react';
import Engine from '../../../core/Engine';
import { IQRState } from './types';

interface QRHardwareAwarenessResult {
  QRState: IQRState;
  isSigningQRObject: boolean;
  isSyncingQRHardware: boolean;
}

const useQRHardwareAwareness = (): QRHardwareAwarenessResult => {
  const [QRState, setQRState] = useState<IQRState>({
    sync: {
      reading: false,
    },
    sign: {},
  });

  const subscribeKeyringState = (value: IQRState) => {
    setQRState(value);
  };

  useEffect(() => {
    Engine.context.KeyringController.getOrAddQRKeyring();
    Engine.controllerMessenger.subscribe(
      'KeyringController:qrKeyringStateChange',
      subscribeKeyringState,
    );
    return () => {
      Engine.controllerMessenger.unsubscribe(
        'KeyringController:qrKeyringStateChange',
        subscribeKeyringState,
      );
    };
  }, []);

  return {
    QRState,
    isSigningQRObject: !!QRState.sign?.request,
    isSyncingQRHardware: QRState.sync.reading,
  };
};

export default useQRHardwareAwareness;
