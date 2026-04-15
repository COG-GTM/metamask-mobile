import { useState, useEffect } from 'react';
import { State } from 'react-native-ble-plx';


const useBluetooth = (hasBluetoothPermissions) => {
  const [bluetoothOn, setBluetoothOn] = useState(false);
  const [bluetoothConnectionError, setBluetoothConnectionError] =
  useState();

  // Monitoring for the BLE adapter to be turned on
  useEffect(() => {
    if (hasBluetoothPermissions) {
      let subscription;

      import('@ledgerhq/react-native-hw-transport-ble').then(
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (BluetoothTransport) => {
          subscription = BluetoothTransport.default.observeState({
            next: (e) => {
              if (e.available && e.type === State.PoweredOn && !bluetoothOn) {
                setBluetoothOn(true);
                setBluetoothConnectionError(false);
              }
              if (!e.available && e.type === State.PoweredOff) {
                setBluetoothOn(false);
                setBluetoothConnectionError(true);
              }
            }
          });
        }
      );

      return () => subscription?.unsubscribe();
    }
  }, [hasBluetoothPermissions, bluetoothOn]);

  return {
    bluetoothOn,
    bluetoothConnectionError
  };
};

export default useBluetooth;