import { KeyringControllerState } from '@metamask/keyring-controller';
import Logger from '../../util/Logger';
import {
  getInternetCredentials,
  setInternetCredentials,
  resetInternetCredentials,
  Options,
  ACCESSIBLE,
} from 'react-native-keychain';
import {
  VAULT_BACKUP_FAILED,
  VAULT_FAILED_TO_GET_VAULT_FROM_BACKUP,
  VAULT_BACKUP_KEY,
  VAULT_BACKUP_TEMP_KEY,
  TEMP_VAULT_BACKUP_FAILED,
} from './constants';

const options: Options = {
  accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

interface KeyringBackupResponse {
  success: boolean;
  vault?: string;
  error?: string;
  skipped?: boolean;
}

// Vault held by the primary keychain backup after the last completed operation.
let lastBackedUpVault: string | undefined;
let keychainQueue: Promise<unknown> = Promise.resolve();

/**
 * Runs keychain backup operations one at a time so that overlapping backups
 * and clears cannot interleave and `lastBackedUpVault` matches the keychain.
 */
const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = keychainQueue.then(operation, operation);
  keychainQueue = result.catch(() => undefined);
  return result;
};

/**
 * Removes the primary vault backup from react-native-keychain
 */
const _resetVaultBackup = async (): Promise<void> => {
  // Clear existing backup
  await resetInternetCredentials(VAULT_BACKUP_KEY);
};

/**
 * Removes the temporary vault backup from react-native-keychain
 */
const _resetTemporaryVaultBackup = async (): Promise<void> => {
  // Clear temporary backup
  await resetInternetCredentials(VAULT_BACKUP_TEMP_KEY);
};

/**
 * Clears all vault backups from react-native-keychain
 */
export function clearAllVaultBackups(): Promise<void> {
  return serialize(async () => {
    lastBackedUpVault = undefined;
    await _resetVaultBackup();
    await _resetTemporaryVaultBackup();
  });
}

/**
 * places the vault in react-native-keychain for backup
 * @returns Promise<KeyringBackupResponse>
  interface KeyringBackupResponse {
    success: boolean;
    error?: string;
    vault?: string;
  }
 */
export function backupVault(
  keyringState: KeyringControllerState,
): Promise<KeyringBackupResponse> {
  return serialize(() => _backupVault(keyringState));
}

/**
 * Backs up the vault unless the primary keychain backup already holds it, so
 * keyring updates that leave the vault unchanged (lock, unlock, account
 * metadata) do not rewrite the keychain.
 * @returns Promise<KeyringBackupResponse>
 */
export function backupVaultIfChanged(
  keyringState: KeyringControllerState,
): Promise<KeyringBackupResponse> {
  return serialize(async () => {
    if (keyringState.vault && keyringState.vault === lastBackedUpVault) {
      return { success: true, vault: keyringState.vault, skipped: true };
    }
    return _backupVault(keyringState);
  });
}

async function _backupVault(
  keyringState: KeyringControllerState,
): Promise<KeyringBackupResponse> {
  const keyringVault = keyringState.vault as string;
  lastBackedUpVault = undefined;

  try {
    // Does a primary backup exist?
    const existingBackup = await getInternetCredentials(VAULT_BACKUP_KEY);

    // An existing backup exists, backup it to the temp key
    if (existingBackup && existingBackup.password) {
      const existingVault = existingBackup.password;

      // Clear any existing temporary backup
      await _resetTemporaryVaultBackup();

      // Then back up a secondary copy of the vault
      const tempBackupResult = await setInternetCredentials(
        VAULT_BACKUP_TEMP_KEY,
        VAULT_BACKUP_TEMP_KEY,
        existingVault,
        options,
      );

      // Temporary vault backup failed, throw error
      if (!tempBackupResult) {
        throw new Error(TEMP_VAULT_BACKUP_FAILED);
      }
    }

    // Clear any existing vault backup first to prevent "item already exists" errors
    await _resetVaultBackup();

    // Backup primary vault
    const backupResult = await setInternetCredentials(
      VAULT_BACKUP_KEY,
      VAULT_BACKUP_KEY,
      keyringVault,
      options,
    );

    // Vault backup failed, throw error
    if (!backupResult) {
      throw new Error(VAULT_BACKUP_FAILED);
    }

    // Clear the temporary backup
    await _resetTemporaryVaultBackup();

    lastBackedUpVault = keyringVault;

    return {
      success: true,
      vault: keyringState.vault,
    };
  } catch (error) {
    Logger.error(error as Error, 'Vault backup failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : VAULT_BACKUP_FAILED,
    };
  }
}

/**
 * retrieves the vault backup from react-native-keychain
 * @returns Promise<KeyringBackupResponse>
  interface KeyringBackupResponse {
    success: boolean;
    error?: string;
    vault?: string;
  }
 */
export async function getVaultFromBackup(): Promise<KeyringBackupResponse> {
  const primaryVaultCredentials = await getInternetCredentials(
    VAULT_BACKUP_KEY,
  );
  if (primaryVaultCredentials) {
    return { success: true, vault: primaryVaultCredentials.password };
  }
  const temporaryVaultCredentials = await getInternetCredentials(
    VAULT_BACKUP_TEMP_KEY,
  );
  if (temporaryVaultCredentials) {
    return { success: true, vault: temporaryVaultCredentials.password };
  }

  const vaultFetchError = new Error(VAULT_BACKUP_KEY);
  Logger.error(vaultFetchError, VAULT_FAILED_TO_GET_VAULT_FROM_BACKUP);
  return { success: false, error: VAULT_FAILED_TO_GET_VAULT_FROM_BACKUP };
}
