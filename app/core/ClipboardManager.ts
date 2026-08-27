/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-shadow */
import Clipboard from '@react-native-clipboard/clipboard';
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
      await (Clipboard as any).setStringExpire(string);
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const currentString = await this.getString();

        if (!currentString) return;

        await (Clipboard as any).clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
