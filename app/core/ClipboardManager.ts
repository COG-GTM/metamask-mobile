import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

const ClipboardManager = {
  async getString() {
    return await Clipboard.getString();
  },
  async setString(string: string) {
    await Clipboard.setString(string);
  },
  expireTime: null as ReturnType<typeof setTimeout> | null,
  async setStringExpire(string: string) {
    if (Device.isIos()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (Clipboard as any).setStringExpire(string);
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const string = await this.getString();

        if (!string) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (Clipboard as any).clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
