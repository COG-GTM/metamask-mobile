import {
  ACCESSIBLE,
  getGenericPassword,
  setGenericPassword,
} from 'react-native-keychain';
import type { Json } from '@metamask/utils';
import StorageWrapper from '../../store/storage-wrapper';
import { WALLETCONNECT_SESSIONS } from '../../constants/storage';
import { Encryptor, LEGACY_DERIVATION_OPTIONS } from '../Encryptor';
import { getRandomBytes } from '../Encryptor/bytes';
import Logger from '../../util/Logger';

export const WALLETCONNECT_SESSIONS_KEYCHAIN_SERVICE =
  'com.metamask.walletconnect-sessions';
const KEYCHAIN_USERNAME = 'metamask-walletconnect';
const STORAGE_KEY_BYTES = 32;

export type WalletConnectSessionRecord = Record<string, Json>;

// The password is a random 256-bit secret, so PBKDF2 stretching adds nothing.
const encryptor = new Encryptor({
  keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
});

let storageKeyPromise: Promise<string> | null = null;

const loadOrCreateStorageKey = async (): Promise<string> => {
  const existing = await getGenericPassword({
    service: WALLETCONNECT_SESSIONS_KEYCHAIN_SERVICE,
  });
  if (existing && existing.password) {
    return existing.password;
  }

  const key = Buffer.from(getRandomBytes(STORAGE_KEY_BYTES)).toString('base64');
  const stored = await setGenericPassword(KEYCHAIN_USERNAME, key, {
    service: WALLETCONNECT_SESSIONS_KEYCHAIN_SERVICE,
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  if (!stored) {
    throw new Error('Unable to store WalletConnect session key in Keychain');
  }
  return key;
};

const getStorageKey = (): Promise<string> => {
  if (!storageKeyPromise) {
    storageKeyPromise = loadOrCreateStorageKey().catch((error) => {
      storageKeyPromise = null;
      throw error;
    });
  }
  return storageKeyPromise;
};

const clearStoredSessions = async (): Promise<void> => {
  try {
    await StorageWrapper.removeItem(WALLETCONNECT_SESSIONS);
  } catch (error) {
    Logger.error(error as Error, 'WC: Failed to clear stored sessions');
  }
};

/**
 * Encrypts WalletConnect v1 sessions (which contain the bridge symmetric key)
 * with a Keychain-held key before writing them to MMKV.
 * If encryption is not possible the stored sessions are cleared rather than
 * written in plaintext.
 */
export const persistWalletConnectSessions = async (
  sessions: WalletConnectSessionRecord[],
): Promise<void> => {
  try {
    const key = await getStorageKey();
    const encrypted = await encryptor.encrypt(key, sessions);
    await StorageWrapper.setItem(WALLETCONNECT_SESSIONS, encrypted);
  } catch (error) {
    Logger.error(error as Error, 'WC: Failed to persist encrypted sessions');
    await clearStoredSessions();
  }
};

/**
 * Reads and decrypts persisted WalletConnect v1 sessions.
 * Legacy plaintext data is re-written encrypted. Data that can no longer be
 * decrypted (e.g. Keychain key lost after a restore) is discarded.
 */
export const loadWalletConnectSessions = async (): Promise<
  WalletConnectSessionRecord[]
> => {
  const stored = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
  if (!stored) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    Logger.error(error as Error, 'WC: Discarding unreadable sessions');
    await clearStoredSessions();
    return [];
  }

  if (Array.isArray(parsed)) {
    await persistWalletConnectSessions(parsed);
    return parsed;
  }

  let key: string;
  try {
    key = await getStorageKey();
  } catch (error) {
    Logger.error(error as Error, 'WC: Unable to read session key');
    return [];
  }

  try {
    const sessions = await encryptor.decrypt(key, stored);
    if (!Array.isArray(sessions)) {
      throw new Error('Decrypted WalletConnect sessions are not a list');
    }
    return sessions;
  } catch (error) {
    Logger.error(error as Error, 'WC: Discarding undecryptable sessions');
    await clearStoredSessions();
    return [];
  }
};
