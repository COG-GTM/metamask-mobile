import Clipboard from '@react-native-clipboard/clipboard';
import { NativeModules } from 'react-native';
import ClipboardManager from './ClipboardManager';
import Device from '../util/device';

jest.mock('../util/device', () => ({
  isIos: jest.fn(),
}));

describe('ClipboardManager.setStringExpire', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    Clipboard.setStringExpire = jest.fn();
    Clipboard.clearString = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete NativeModules.SensitiveClipboard;
  });

  it('uses the expiring clipboard API on iOS', async () => {
    Device.isIos.mockReturnValue(true);
    await ClipboardManager.setStringExpire('secret');
    expect(Clipboard.setStringExpire).toHaveBeenCalledWith('secret');
  });

  it('flags the clip as sensitive on Android and clears it after the timeout', async () => {
    Device.isIos.mockReturnValue(false);
    const setSensitiveString = jest.fn().mockResolvedValue(undefined);
    NativeModules.SensitiveClipboard = { setSensitiveString };
    Clipboard.getString.mockResolvedValue('secret');

    await ClipboardManager.setStringExpire('secret');

    expect(setSensitiveString).toHaveBeenCalledWith('secret');
    expect(Clipboard.setString).not.toHaveBeenCalled();

    jest.advanceTimersByTime(60000);
    await Promise.resolve();
    await Promise.resolve();
    expect(Clipboard.clearString).toHaveBeenCalled();
  });

  it('falls back to a plain copy when the native module is unavailable', async () => {
    Device.isIos.mockReturnValue(false);
    await ClipboardManager.setStringExpire('secret');
    expect(Clipboard.setString).toHaveBeenCalledWith('secret');
  });
});
