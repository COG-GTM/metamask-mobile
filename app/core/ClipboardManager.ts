import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ClipboardWithExtras = Clipboard as any;

const EXPIRE_TIME_MS = 60000;

const ClipboardManager = {
  async getString(): Promise<string> {
    return await Clipboard.getString();
  },
  async setString(string: string): Promise<void> {
    await Clipboard.setString(string);
  },
  expireTime: null as ReturnType<typeof setTimeout> | null,
  async setStringExpire(string: string): Promise<void> {
    if (Device.isIos()) {
      await ClipboardWithExtras.setStringExpire(string);
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const clipboardContent = await this.getString();

        if (!clipboardContent) return;

        await ClipboardWithExtras.clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
