import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

const ClipboardManager = {
  async getString(): Promise<string> {
    return await Clipboard.getString();
  },
  async setString(string: string | null): Promise<void> {
    await Clipboard.setString(string ?? '');
  },
  expireTime: null as ReturnType<typeof setTimeout> | null,
  async setStringExpire(string: string): Promise<void> {
    if (Device.isIos()) {
      await (Clipboard as unknown as Record<string, (...args: unknown[]) => Promise<void>>).setStringExpire(string);
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const currentString = await this.getString();

        if (!currentString) return;

        await (Clipboard as unknown as { clearString: () => Promise<void> }).clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
