import Clipboard from '@react-native-clipboard/clipboard';
import { AppState } from 'react-native';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import Device from '../util/device';
import StorageWrapper from '../store/storage-wrapper';
import Logger from '../util/Logger';

const EXPIRE_TIME_MS = 60000;

// Persisted marker holding the SHA-256 of a secret that still needs to be
// cleared from the clipboard. It survives process death so the secret can be
// removed on the next app launch, and stores a one-way hash rather than the
// secret itself.
export const PENDING_CLEAR_HASH_KEY = 'CLIPBOARD_PENDING_CLEAR_HASH';

const hashString = (string) => bytesToHex(sha256(utf8ToBytes(string)));

const ClipboardManager = {
  async getString() {
    return await Clipboard.getString();
  },
  async setString(string) {
    await Clipboard.setString(string);
  },
  expireTime: null,
  appStateSubscription: null,
  // SHA-256 of the secret currently subject to expiry, used to confirm the
  // clipboard still holds our secret before clearing it.
  trackedHash: null,
  /**
   * Copy a secret (e.g. SRP / private key) that must not linger on the
   * clipboard. iOS uses the native expiring pasteboard. Android has no such
   * primitive, so the content is flagged as sensitive (API 33+) and cleared via
   * a timer plus durable fallbacks that survive the JS timer being frozen while
   * backgrounded or the process being killed.
   */
  async setStringExpire(string) {
    if (Device.isIos()) {
      await Clipboard.setStringExpire(string);
      return;
    }

    if (typeof Clipboard.setStringSensitive === 'function') {
      await Clipboard.setStringSensitive(string);
    } else {
      await this.setString(string);
    }

    this.trackedHash = hashString(string);
    try {
      await StorageWrapper.setItem(PENDING_CLEAR_HASH_KEY, this.trackedHash);
    } catch (error) {
      Logger.error(
        error,
        'ClipboardManager: failed to persist pending clipboard clear',
      );
    }

    this.registerAppStateListener();

    if (this.expireTime) {
      clearTimeout(this.expireTime);
    }
    this.expireTime = setTimeout(() => {
      this.clearExpiredString(this.trackedHash);
    }, EXPIRE_TIME_MS);
  },
  /**
   * Clears the clipboard only if it still holds the tracked secret, then tears
   * down the timer, listener and persisted marker.
   */
  async clearExpiredString(expectedHash) {
    const hash = expectedHash || this.trackedHash;
    try {
      if (hash) {
        const current = await this.getString();
        if (current && hashString(current) === hash) {
          await Clipboard.clearString();
        }
      }
    } catch (error) {
      Logger.error(error, 'ClipboardManager: failed to clear clipboard');
    } finally {
      this.trackedHash = null;
      if (this.expireTime) {
        clearTimeout(this.expireTime);
        this.expireTime = null;
      }
      try {
        await StorageWrapper.removeItem(PENDING_CLEAR_HASH_KEY);
      } catch (error) {
        Logger.error(
          error,
          'ClipboardManager: failed to remove pending clipboard clear marker',
        );
      }
    }
  },
  registerAppStateListener() {
    if (this.appStateSubscription) {
      return;
    }
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        // Returning to the foreground is a reliable moment to clear the secret:
        // the JS expiry timer is throttled/stopped while backgrounded, so we
        // enforce clearing as soon as the user comes back.
        if (nextAppState === 'active' && this.trackedHash) {
          this.clearExpiredString(this.trackedHash);
        }
      },
    );
  },
  /**
   * Called once on app start to clear any secret left on the clipboard when the
   * process was killed before the expiry timer could run.
   */
  async handleStartup() {
    try {
      const pendingHash = await StorageWrapper.getItem(PENDING_CLEAR_HASH_KEY);
      if (pendingHash) {
        await this.clearExpiredString(pendingHash);
      }
    } catch (error) {
      Logger.error(
        error,
        'ClipboardManager: failed to clear pending clipboard on startup',
      );
    }
  },
};

export default ClipboardManager;
