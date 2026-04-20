import { act, renderHook } from '@testing-library/react-hooks';
import useLedgerBluetooth from './useLedgerBluetooth';
import {
  connectLedgerHardware,
  openEthereumAppOnLedger,
  closeRunningAppOnLedger,
} from '../../../core/Ledger/Ledger';
import { LedgerCommunicationErrors } from '../../../core/Ledger/ledgerErrors';

jest.mock('../../../core/Ledger/Ledger', () => ({
  connectLedgerHardware: jest.fn(),
  openEthereumAppOnLedger: jest.fn(),
  closeRunningAppOnLedger: jest.fn(),
}));

const mockClose = jest.fn();
const mockOn = jest.fn();

jest.mock(
  '@ledgerhq/react-native-hw-transport-ble',
  () => ({
    __esModule: true,
    default: {
      open: jest.fn().mockResolvedValue({
        on: (...args: unknown[]) => mockOn(...args),
        close: (...args: unknown[]) => mockClose(...args),
      }),
    },
  }),
  { virtual: true },
);

describe('useLedgerBluetooth', () => {
  beforeEach(() => {
    (connectLedgerHardware as jest.Mock).mockReset();
    (openEthereumAppOnLedger as jest.Mock).mockReset();
    (closeRunningAppOnLedger as jest.Mock).mockReset();
    mockClose.mockReset();
    mockOn.mockReset();
  });

  it('exposes the expected hook API and initial state', () => {
    const { result } = renderHook(() => useLedgerBluetooth('device-1'));
    expect(result.current.isSendingLedgerCommands).toBe(false);
    expect(result.current.isAppLaunchConfirmationNeeded).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.ledgerLogicToRun).toBe('function');
    expect(typeof result.current.cleanupBluetoothConnection).toBe('function');
  });

  it('runs the provided logic when on the Ethereum app', async () => {
    (connectLedgerHardware as jest.Mock).mockResolvedValue('Ethereum');
    const logic = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useLedgerBluetooth('device-1'));

    await act(async () => {
      await result.current.ledgerLogicToRun(logic);
    });

    expect(logic).toHaveBeenCalledTimes(1);
  });

  it('captures errors when the Ledger reports the wallet is locked', async () => {
    const error = Object.assign(new Error('locked'), {
      name: 'TransportStatusError',
      statusCode: 0x6b0c,
    });
    (connectLedgerHardware as jest.Mock).mockRejectedValue(error);
    const logic = jest.fn();

    const { result, waitFor } = renderHook(() =>
      useLedgerBluetooth('device-1'),
    );

    await act(async () => {
      await result.current.ledgerLogicToRun(logic);
    });

    await waitFor(() =>
      expect(result.current.error).toBe(LedgerCommunicationErrors.LedgerIsLocked),
    );
    expect(logic).not.toHaveBeenCalled();
  });

  it('cleanupBluetoothConnection resets sending state', () => {
    const { result } = renderHook(() => useLedgerBluetooth('device-1'));
    act(() => {
      result.current.cleanupBluetoothConnection();
    });
    expect(result.current.isSendingLedgerCommands).toBe(false);
  });
});
