import { useEffect, useState } from 'react';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { Observable } from 'rxjs';






// Works with any Bluetooth Interface that provides a listen method



















const useBluetoothDevices = (
hasBluetoothPermissions,
bluetoothOn) =>
{
  const [devices, setDevices] = useState({});
  const [deviceScanError, setDeviceScanError] = useState(false);
  const [observableEvent, setObservableEvent] = useState();

  // Initiate scanning and pairing if bluetooth is enabled
  useEffect(() => {
    let subscription;

    if (hasBluetoothPermissions && bluetoothOn) {
      subscription = new Observable(TransportBLE.listen).subscribe({
        next: (e) => {
          setObservableEvent(e);
        },
        error: (_error) => {
          setDeviceScanError(true);
        }
      });
    }

    return () => {
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBluetoothPermissions, bluetoothOn]);

  useEffect(() => {
    if (observableEvent?.descriptor) {
      const btDevice = observableEvent.descriptor;
      const deviceFound = devices[btDevice.id];

      if (observableEvent.type === 'add' && !deviceFound) {
        setDevices((prevValues) => ({
          ...prevValues,
          [btDevice.id]: btDevice
        }));
        setDeviceScanError(false);
      }
    }
  }, [observableEvent, devices]);

  return {
    deviceScanError,
    devices: Object.values(devices)
  };
};

export default useBluetoothDevices;