import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

// setStringExpire / clearString are added by a local patch of the clipboard package
const NativeClipboard = Clipboard as typeof Clipboard & {
  setStringExpire(content: string): Promise<void>;
  clearString(): Promise<void>;
};

const EXPIRE_TIME_MS = 60000;

interface ClipboardManagerType {
  getString(): Promise<string>;
  setString(string: string | null): Promise<void>;
  expireTime: ReturnType<typeof setTimeout> | null;
  setStringExpire(string: string): Promise<void>;
}

const ClipboardManager: ClipboardManagerType = {
  async getString() {
    return await Clipboard.getString();
  },
  async setString(string: string | null) {
    await Clipboard.setString(string as string);
  },
  expireTime: null,
  async setStringExpire(string: string) {
    if (Device.isIos()) {
      await NativeClipboard.setStringExpire(string);
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const clipboardString = await this.getString();

        if (!clipboardString) return;

        await NativeClipboard.clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
