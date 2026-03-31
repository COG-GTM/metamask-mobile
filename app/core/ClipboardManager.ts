import Clipboard from '@react-native-clipboard/clipboard';
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ClipboardNative = Clipboard as any;
import Device from '../util/device';

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
      await ClipboardNative.setStringExpire(string);
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const string = await this.getString();

        if (!string) return;

        await ClipboardNative.clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
