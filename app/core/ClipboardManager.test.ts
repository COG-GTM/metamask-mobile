import Clipboard from '@react-native-clipboard/clipboard';
import ClipboardManager from './ClipboardManager';
import Device from '../util/device';

jest.mock('../util/device', () => ({
  isIos: jest.fn(),
  isAndroid: jest.fn(),
}));

describe('ClipboardManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    ['ios', true],
    ['android', false],
  ])(
    'setStringExpire delegates expiry to the native module on %s',
    async (_platform, isIos) => {
      (Device.isIos as jest.Mock).mockReturnValue(isIos);
      (Device.isAndroid as jest.Mock).mockReturnValue(!isIos);

      await ClipboardManager.setStringExpire('secret recovery phrase');

      expect(Clipboard.setStringExpire).toHaveBeenCalledTimes(1);
      expect(Clipboard.setStringExpire).toHaveBeenCalledWith(
        'secret recovery phrase',
      );
      expect(Clipboard.setString).not.toHaveBeenCalled();
      // No JS timer: React Native pauses those while the app is backgrounded on Android.
      expect(jest.getTimerCount()).toBe(0);
      jest.advanceTimersByTime(120000);
      expect(Clipboard.clearString).not.toHaveBeenCalled();
    },
  );

  it('setString writes without expiry', async () => {
    await ClipboardManager.setString('0xabc');
    expect(Clipboard.setString).toHaveBeenCalledWith('0xabc');
    expect(Clipboard.setStringExpire).not.toHaveBeenCalled();
  });
});
