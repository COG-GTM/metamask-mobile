import { renderHook } from '@testing-library/react-hooks';
import useScreenshotDeterrent from './useScreenshotDeterrent';
import Device from '../../util/device';

const mockAddListener = jest.fn();
const mockRemove = jest.fn();

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    NativeModules: {
      ...actual.NativeModules,
      ScreenshotDetect: {},
    },
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
      addListener: mockAddListener,
    })),
  };
});

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void | (() => void)) => {
    // Invoke the effect immediately so the listener is registered during renderHook.
    const cleanup = cb();
    if (typeof cleanup === 'function') {
      // expose cleanup for later tests via side channel
      (global as unknown as { __focusCleanup?: () => void }).__focusCleanup =
        cleanup;
    }
  },
}));

jest.mock('../../util/device', () => ({
  __esModule: true,
  default: {
    isAndroid: jest.fn(() => false),
  },
}));

describe('useScreenshotDeterrent', () => {
  beforeEach(() => {
    mockAddListener.mockReset();
    mockRemove.mockReset();
    mockAddListener.mockReturnValue({ remove: mockRemove });
    (Device.isAndroid as jest.Mock).mockReturnValue(false);
  });

  it('registers a screenshot listener on focus and returns setEnabled', () => {
    const warning = jest.fn();
    const { result } = renderHook(() => useScreenshotDeterrent(warning));

    expect(mockAddListener).toHaveBeenCalledTimes(1);
    expect(typeof result.current[0]).toBe('function');
  });

  it('skips registration on Android', () => {
    (Device.isAndroid as jest.Mock).mockReturnValue(true);
    renderHook(() => useScreenshotDeterrent(jest.fn()));
    expect(mockAddListener).not.toHaveBeenCalled();
  });
});
