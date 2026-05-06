import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

interface ExtendedClipboard {
  setStringExpire(content: string): Promise<void>;
  clearString(): Promise<void>;
}

const ExtendedClipboard = Clipboard as unknown as typeof Clipboard &
  ExtendedClipboard;

interface ClipboardManagerInterface {
  expireTime: ReturnType<typeof setTimeout> | null;
  getString(): Promise<string>;
  setString(string: string | null): Promise<void>;
  setStringExpire(string: string | null): Promise<void>;
}

const ClipboardManager: ClipboardManagerInterface = {
  async getString(): Promise<string> {
    return await Clipboard.getString();
  },
  async setString(string: string | null): Promise<void> {
    await Clipboard.setString(string ?? '');
  },
  expireTime: null,
  async setStringExpire(string: string | null): Promise<void> {
    if (Device.isIos()) {
      await ExtendedClipboard.setStringExpire(string ?? '');
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const current = await this.getString();

        if (!current) return;

        await ExtendedClipboard.clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
