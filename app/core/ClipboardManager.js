import Clipboard from '@react-native-clipboard/clipboard';
import { NativeModules } from 'react-native';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

const ClipboardManager = {
  async getString() {
    return await Clipboard.getString();
  },
  async setString(string) {
    await Clipboard.setString(string);
  },
  expireTime: null,
  async setStringExpire(string) {
    if (Device.isIos()) {
      await Clipboard.setStringExpire(string);
    } else {
      const sensitiveClipboard = NativeModules.SensitiveClipboard;
      if (sensitiveClipboard?.setSensitiveString) {
        await sensitiveClipboard.setSensitiveString(string);
      } else {
        await this.setString(string);
      }
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const string = await this.getString();

        if (!string) return;

        await Clipboard.clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
