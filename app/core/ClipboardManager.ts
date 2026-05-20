import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

interface ClipboardWithExtensions {
  getString(): Promise<string>;
  setString(content: string): void;
  setStringExpire(content: string): void;
  clearString(): void;
}

const ExtendedClipboard = Clipboard as unknown as ClipboardWithExtensions;

const ClipboardManager = {
  async getString(): Promise<string> {
    return await ExtendedClipboard.getString();
  },
  async setString(text: string): Promise<void> {
    await ExtendedClipboard.setString(text);
  },
  expireTime: null as ReturnType<typeof setTimeout> | null,
  async setStringExpire(text: string): Promise<void> {
    if (Device.isIos()) {
      await ExtendedClipboard.setStringExpire(text);
    } else {
      await this.setString(text);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const currentString = await this.getString();

        if (!currentString) return;

        await ExtendedClipboard.clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
