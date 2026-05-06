import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

// Custom native methods not in the official @react-native-clipboard types
const ClipboardNative = Clipboard as typeof Clipboard & {
  setStringExpire: (content: string) => Promise<void>;
  clearString: () => Promise<void>;
};

const ClipboardManager = {
  async getString(): Promise<string> {
    return await Clipboard.getString();
  },
  async setString(content: string | null): Promise<void> {
    await Clipboard.setString(content as string);
  },
  expireTime: null as ReturnType<typeof setTimeout> | null,
  async setStringExpire(content: string): Promise<void> {
    if (Device.isIos()) {
      await ClipboardNative.setStringExpire(content);
    } else {
      await this.setString(content);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const currentString = await this.getString();

        if (!currentString) return;

        await ClipboardNative.clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
