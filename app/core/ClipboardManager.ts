import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

/**
 * `setStringExpire` (iOS) and `clearString` (Android) are added to the native
 * clipboard module by `patches/@react-native-clipboard+clipboard+1.16.1.patch`,
 * so they are missing from the published typings unless the patch is applied.
 */
interface PatchedClipboardMethods {
  setStringExpire(content: string): void;
  clearString(): void;
}

const PatchedClipboard = Clipboard as typeof Clipboard &
  PatchedClipboardMethods;

const ClipboardManager = {
  async getString(): Promise<string> {
    return await Clipboard.getString();
  },
  /**
   * Callers copy values held in optional model fields, so `null` is forwarded
   * to the native module unchanged.
   */
  async setString(string: string | null): Promise<void> {
    await Clipboard.setString(string as string);
  },
  expireTime: null as ReturnType<typeof setTimeout> | null,
  async setStringExpire(string: string): Promise<void> {
    if (Device.isIos()) {
      await PatchedClipboard.setStringExpire(string);
    } else {
      await this.setString(string);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const clipboardString = await this.getString();

        if (!clipboardString) return;

        await PatchedClipboard.clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
