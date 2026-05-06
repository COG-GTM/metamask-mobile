import RNClipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

// react-native-clipboard exposes some platform-specific methods
// (setStringExpire, clearString) that are not declared in its types.
const Clipboard = RNClipboard as unknown as typeof RNClipboard & {
  setStringExpire: (str: string) => Promise<void>;
  clearString: () => Promise<void>;
};

interface ClipboardManagerType {
  getString: () => Promise<string>;
  setString: (string: string) => Promise<void>;
  expireTime: ReturnType<typeof setTimeout> | null;
  setStringExpire: (string: string) => Promise<void>;
}

const ClipboardManager: ClipboardManagerType = {
  async getString(): Promise<string> {
    return await Clipboard.getString();
  },
  async setString(string: string): Promise<void> {
    await Clipboard.setString(string);
  },
  expireTime: null,
  async setStringExpire(string: string): Promise<void> {
    if (Device.isIos()) {
      await Clipboard.setStringExpire(string);
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const stringValue = await this.getString();

        if (!stringValue) return;

        await Clipboard.clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
