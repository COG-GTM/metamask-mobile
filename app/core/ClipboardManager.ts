import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

// MetaMask patches `@react-native-clipboard/clipboard` (see patches/) to add
// `setStringExpire` and `clearString`, which are not part of its public types.
interface ClipboardWithExpire {
  setStringExpire(content: string): void;
  clearString(): void;
}
const ExtendedClipboard = Clipboard as typeof Clipboard & ClipboardWithExpire;

const ClipboardManager = {
  async getString(): Promise<string> {
    return await Clipboard.getString();
  },
  async setString(content: string): Promise<void> {
    await Clipboard.setString(content);
  },
  expireTime: null as ReturnType<typeof setTimeout> | null,
  async setStringExpire(content: string): Promise<void> {
    if (Device.isIos()) {
      await ExtendedClipboard.setStringExpire(content);
    } else {
      await this.setString(content);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const string = await this.getString();

        if (!string) return;

        await ExtendedClipboard.clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
