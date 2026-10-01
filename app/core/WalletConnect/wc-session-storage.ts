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
const KEY_READ_ATTEMPTS = 3;
const KEY_READ_RETRY_MS = 500;

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

const readStored = async (): Promise<string | null> => {
  try {
    return await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
  } catch (error) {
    Logger.error(error as Error, 'WC: Failed to read stored sessions');
    return null;
  }
};

const isLegacyPlaintext = (stored: string): boolean => {
  try {
    return Array.isArray(JSON.parse(stored));
  } catch {
    return false;
  }
};

const decryptSessions = async (
  key: string,
  stored: string,
): Promise<WalletConnectSessionRecord[]> => {
  const sessions = await encryptor.decrypt(key, stored);
  if (!Array.isArray(sessions)) {
    throw new Error('Decrypted WalletConnect sessions are not a list');
  }
  return sessions;
};

const loadStorageKeyWithRetry = async (): Promise<string> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await getStorageKey();
    } catch (error) {
      if (attempt >= KEY_READ_ATTEMPTS) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, KEY_READ_RETRY_MS));
    }
  }
};

/**
 * Set when stored ciphertext could not be decrypted on load because the
 * Keychain was unavailable. The next write merges those sessions back in
 * instead of overwriting them.
 */
let restorePending = false;
let writeQueue: Promise<void> = Promise.resolve();

const discardLegacyPlaintext = async (): Promise<void> => {
  const stored = await readStored();
  if (stored && isLegacyPlaintext(stored)) {
    await clearStoredSessions();
  }
};

const writeSessions = async (
  sessions: WalletConnectSessionRecord[],
): Promise<void> => {
  let key: string;
  try {
    key = await getStorageKey();
  } catch (error) {
    Logger.error(error as Error, 'WC: Failed to persist encrypted sessions');
    await discardLegacyPlaintext();
    return;
  }

  let toWrite = sessions;
  if (restorePending) {
    const stored = await readStored();
    if (stored && !isLegacyPlaintext(stored)) {
      try {
        const unrestored = await decryptSessions(key, stored);
        const current = new Set(sessions.map((session) => session.key));
        toWrite = [
          ...sessions,
          ...unrestored.filter((session) => !current.has(session.key)),
        ];
      } catch (error) {
        Logger.error(error as Error, 'WC: Discarding undecryptable sessions');
      }
    }
    restorePending = false;
  }

  try {
    const encrypted = await encryptor.encrypt(key, toWrite);
    await StorageWrapper.setItem(WALLETCONNECT_SESSIONS, encrypted);
  } catch (error) {
    Logger.error(error as Error, 'WC: Failed to persist encrypted sessions');
    await discardLegacyPlaintext();
  }
};

/**
 * Encrypts WalletConnect v1 sessions (which contain the bridge symmetric key)
 * with a Keychain-held key and writes them to MMKV. Writes are applied in call
 * order. If encryption fails, previously encrypted data is kept and legacy
 * plaintext data is removed; sessions are never written in plaintext.
 *
 * @param sessions - Sessions to persist, replacing the stored list.
 * @returns Resolves once this write has been applied.
 */
export const persistWalletConnectSessions = (
  sessions: WalletConnectSessionRecord[],
): Promise<void> => {
  const write = writeQueue.then(() => writeSessions(sessions));
  writeQueue = write.catch(() => undefined);
  return write;
};

/**
 * Reads and decrypts persisted WalletConnect v1 sessions.
 * Legacy plaintext data is re-written encrypted. Data that can no longer be
 * decrypted (e.g. Keychain key lost after a restore) is discarded. If the
 * Keychain is unavailable the ciphertext is kept for a later read or write.
 *
 * @returns The persisted sessions, or an empty list if none can be read.
 */
export const loadWalletConnectSessions = async (): Promise<
  WalletConnectSessionRecord[]
> => {
  await writeQueue;
  const stored = await readStored();
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
    key = await loadStorageKeyWithRetry();
  } catch (error) {
    Logger.error(error as Error, 'WC: Unable to read session key');
    restorePending = true;
    return [];
  }

  try {
    const sessions = await decryptSessions(key, stored);
    restorePending = false;
    return sessions;
  } catch (error) {
    Logger.error(error as Error, 'WC: Discarding undecryptable sessions');
    await clearStoredSessions();
    return [];
  }
};
