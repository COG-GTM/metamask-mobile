import ClipboardManager from './ClipboardManager';
import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

jest.mock('@react-native-clipboard/clipboard', () => ({
  getString: jest.fn(),
  setString: jest.fn(),
  setStringExpire: jest.fn(),
  clearString: jest.fn(),
}));

jest.mock('../util/device', () => ({
  isIos: jest.fn(),
}));

describe('ClipboardManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    ClipboardManager.expireTime = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('getString should return clipboard content', async () => {
    Clipboard.getString.mockResolvedValue('test');
    const result = await ClipboardManager.getString();
    expect(result).toBe('test');
  });

  it('setString should set clipboard content', async () => {
    await ClipboardManager.setString('hello');
    expect(Clipboard.setString).toHaveBeenCalledWith('hello');
  });

  it('setStringExpire should use native expire on iOS', async () => {
    Device.isIos.mockReturnValue(true);
    await ClipboardManager.setStringExpire('secret');
    expect(Clipboard.setStringExpire).toHaveBeenCalledWith('secret');
  });

  it('setStringExpire should set timeout on Android', async () => {
    Device.isIos.mockReturnValue(false);
    await ClipboardManager.setStringExpire('secret');
    expect(Clipboard.setString).toHaveBeenCalledWith('secret');
    expect(ClipboardManager.expireTime).not.toBeNull();
  });
});
