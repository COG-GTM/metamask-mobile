import { useEffect, useState } from 'react';

import Engine from '../../../../../core/Engine';


export const useQRHardwareAwareness = () => {
  const [QRState, SetQRState] = useState({
    sync: {
      reading: false
    },
    sign: {}
  });

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscribeKeyringState = (value) => {
    SetQRState(value);
  };

  useEffect(() => {
    // This ensures that a QR keyring gets created if it doesn't already exist.
    // This is intentionally not awaited (the subscription still gets setup correctly if called
    // before the keyring is created).
    // TODO: Stop automatically creating keyrings
    Engine.context.KeyringController.getOrAddQRKeyring();
    Engine.controllerMessenger.subscribe(
      'KeyringController:qrKeyringStateChange',
      subscribeKeyringState
    );
    return () => {
      Engine.controllerMessenger.unsubscribe(
        'KeyringController:qrKeyringStateChange',
        subscribeKeyringState
      );
    };
  }, []);

  return {
    isQRSigningInProgress: QRState?.sign?.request !== undefined,
    isSigningQRObject: !!QRState?.sign?.request,
    QRState
  };
};