import Clipboard from '@react-native-clipboard/clipboard';

const ClipboardManager = {
  async getString() {
    return await Clipboard.getString();
  },
  async setString(string) {
    await Clipboard.setString(string);
  },
  /**
   * Copies sensitive content (SRP, private keys) and expires it after 60 seconds.
   * Expiry is native on both platforms so it still runs while the app is in the
   * background, where React Native pauses JS timers on Android.
   */
  async setStringExpire(string) {
    await Clipboard.setStringExpire(string);
  },
};

export default ClipboardManager;
