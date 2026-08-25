import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

/**
 * iOS-only Clipboard methods that are implemented natively but missing from the
 * `@react-native-clipboard/clipboard` type definitions.
 */
interface ClipboardWithExpire {
  setStringExpire(content: string): Promise<void>;
  clearString(): Promise<void>;
}

const clipboard = Clipboard as typeof Clipboard & ClipboardWithExpire;

const ClipboardManager = {
  async getString(): Promise<string> {
    return await Clipboard.getString();
  },
  async setString(string: string | null): Promise<void> {
    await Clipboard.setString(string as string);
  },
  expireTime: null as ReturnType<typeof setTimeout> | null,
  async setStringExpire(string: string): Promise<void> {
    if (Device.isIos()) {
      await clipboard.setStringExpire(string);
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const currentString = await this.getString();

        if (!currentString) return;

        await clipboard.clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
