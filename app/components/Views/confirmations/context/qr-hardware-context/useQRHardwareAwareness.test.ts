import { act, renderHook } from '@testing-library/react-native';
import { useQRHardwareAwareness } from './useQRHardwareAwareness';
import Engine from '../../../../../core/Engine';
import { IQRState } from '../../../../UI/QRHardware/types';

jest.mock('../../../../../core/Engine', () => ({
  context: {
    KeyringController: {
      getOrAddQRKeyring: jest.fn(),
    },
  },
  controllerMessenger: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

const QR_STATE_CHANGE_EVENT = 'KeyringController:qrKeyringStateChange';

const initialState = {
  QRState: {
    sync: {
      reading: false,
    },
    sign: {},
  },
  isQRSigningInProgress: false,
  isSigningQRObject: false,
};

const signingState: IQRState = {
  sync: {
    reading: false,
  },
  sign: {
    request: {
      requestId: 'c95ecc76-d6e9-4a0a-afa3-31429bc80566',
      payload: {
        type: 'eth-sign-request',
        cbor: 'a501d825509b1deb4d3b7d4bad9bdd2b0d7b3dcb6d',
      },
    },
  },
};

const idleState: IQRState = {
  sync: {
    reading: false,
  },
  sign: {},
};

const mockSubscribe = Engine.controllerMessenger.subscribe as jest.Mock;
const mockUnsubscribe = Engine.controllerMessenger.unsubscribe as jest.Mock;

const getSubscribedHandler = (): ((state: IQRState) => void) => {
  const call = mockSubscribe.mock.calls.find(
    ([eventName]) => eventName === QR_STATE_CHANGE_EVENT,
  );
  if (!call) {
    throw new Error(`No subscription registered for ${QR_STATE_CHANGE_EVENT}`);
  }
  return call[1];
};

describe('useQRHardwareAwareness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invokes required methods from Engine', () => {
    renderHook(() => useQRHardwareAwareness());
    expect(
      Engine.context.KeyringController.getOrAddQRKeyring,
    ).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledWith(
      QR_STATE_CHANGE_EVENT,
      expect.any(Function),
    );
  });

  it('returns correct initial values', () => {
    const { result } = renderHook(() => useQRHardwareAwareness());
    expect(result.current).toMatchObject(initialState);
  });

  it('reports signing in progress when the keyring state has a sign request', () => {
    const { result } = renderHook(() => useQRHardwareAwareness());
    const handler = getSubscribedHandler();

    act(() => {
      handler(signingState);
    });

    expect(result.current.isQRSigningInProgress).toBe(true);
    expect(result.current.isSigningQRObject).toBe(true);
    expect(result.current.QRState).toEqual(signingState);
  });

  it('reports signing finished when the sign request is cleared', () => {
    const { result } = renderHook(() => useQRHardwareAwareness());
    const handler = getSubscribedHandler();

    act(() => {
      handler(signingState);
    });
    expect(result.current.isQRSigningInProgress).toBe(true);

    act(() => {
      handler(idleState);
    });

    expect(result.current.isQRSigningInProgress).toBe(false);
    expect(result.current.isSigningQRObject).toBe(false);
    expect(result.current.QRState).toEqual(idleState);
  });

  it('unsubscribes the same handler on unmount', () => {
    const { unmount } = renderHook(() => useQRHardwareAwareness());
    const handler = getSubscribedHandler();
    expect(mockUnsubscribe).not.toHaveBeenCalled();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      QR_STATE_CHANGE_EVENT,
      handler,
    );
  });

  it('does not re-subscribe on re-render', () => {
    const { rerender } = renderHook(() => useQRHardwareAwareness());
    rerender({});
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).not.toHaveBeenCalled();
  });
});
