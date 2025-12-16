import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

interface ClipboardManagerType {
  getString(): Promise<string>;
  setString(string: string): Promise<void>;
  expireTime: ReturnType<typeof setTimeout> | null;
  setStringExpire(string: string): Promise<void>;
}

const ClipboardManager: ClipboardManagerType = {
  async getString() {
    return await Clipboard.getString();
  },
  async setString(string: string) {
    await Clipboard.setString(string);
  },
  expireTime: null,
  async setStringExpire(string: string) {
    if (Device.isIos()) {
      await (Clipboard as { setStringExpire?: (s: string) => Promise<void> }).setStringExpire?.(string);
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const currentString = await this.getString();

        if (!currentString) return;

        await (Clipboard as { clearString?: () => Promise<void> }).clearString?.();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
