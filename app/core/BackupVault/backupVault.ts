import { KeyringControllerState } from '@metamask/keyring-controller';
import Logger from '../../util/Logger';
import {
  getInternetCredentials,
  setInternetCredentials,
  resetInternetCredentials,
  Options,
  ACCESSIBLE,
  ACCESS_CONTROL,
} from 'react-native-keychain';
import { strings } from '../../../locales/i18n';
import {
  VAULT_BACKUP_FAILED,
  VAULT_FAILED_TO_GET_VAULT_FROM_BACKUP,
  VAULT_BACKUP_KEY,
  VAULT_BACKUP_TEMP_KEY,
  TEMP_VAULT_BACKUP_FAILED,
} from './constants';

// The vault backup contains crown-jewel keyring material (encrypted SRP/keys).
// Gate it behind biometric/passcode access control so a device-local attacker
// cannot read the backup ciphertext without fresh user presence, even while the
// device is unlocked. BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE requires biometrics
// when available and falls back to the device passcode otherwise, avoiding
// lockout on devices without enrolled biometrics.
const options: Options = {
  accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
  authenticationPrompt: {
    title: strings('authentication.auth_prompt_title'),
  },
};

interface KeyringBackupResponse {
  success: boolean;
  vault?: string;
  error?: string;
}

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
export async function clearAllVaultBackups() {
  await _resetVaultBackup();
  await _resetTemporaryVaultBackup();
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
export async function backupVault(
  keyringState: KeyringControllerState,
): Promise<KeyringBackupResponse> {
  const keyringVault = keyringState.vault as string;

  try {
    // Does a primary backup exist?
    const existingBackup = await getInternetCredentials(
      VAULT_BACKUP_KEY,
      options,
    );

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
    options,
  );
  if (primaryVaultCredentials) {
    return { success: true, vault: primaryVaultCredentials.password };
  }
  const temporaryVaultCredentials = await getInternetCredentials(
    VAULT_BACKUP_TEMP_KEY,
    options,
  );
  if (temporaryVaultCredentials) {
    return { success: true, vault: temporaryVaultCredentials.password };
  }

  const vaultFetchError = new Error(VAULT_BACKUP_KEY);
  Logger.error(vaultFetchError, VAULT_FAILED_TO_GET_VAULT_FROM_BACKUP);
  return { success: false, error: VAULT_FAILED_TO_GET_VAULT_FROM_BACKUP };
}
