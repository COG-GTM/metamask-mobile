import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

interface ClipboardApi {
  getString(): Promise<string>;
  setString(value: string): Promise<void>;
  setStringExpire?: (value: string) => Promise<void>;
  clearString?: () => Promise<void>;
}

interface ClipboardManagerApi {
  expireTime: ReturnType<typeof setTimeout> | null;
  getString(): Promise<string>;
  setString(value: string): Promise<void>;
  setStringExpire(value: string): Promise<void>;
}

const clipboard = Clipboard as unknown as ClipboardApi;

const ClipboardManager: ClipboardManagerApi = {
  async getString(): Promise<string> {
    return await Clipboard.getString();
  },
  async setString(string: string): Promise<void> {
    await Clipboard.setString(string);
  },
  expireTime: null,
  async setStringExpire(string: string): Promise<void> {
    if (Device.isIos()) {
      await clipboard.setStringExpire!(string);
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const string = await this.getString();

        if (!string) return;

        await clipboard.clearString!();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
