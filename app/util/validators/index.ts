import { ethers } from 'ethers';
import { Encryptor, LEGACY_DERIVATION_OPTIONS } from '../../core/Encryptor';
import { regex } from '../regex';
import Logger from '../Logger';

export const failedSeedPhraseRequirements = (seed: string): boolean => {
  const wordCount = seed.split(/\s/u).length;
  return wordCount % 3 !== 0 || wordCount > 24 || wordCount < 12;
};

/**
 * Reports why a vault could not be parsed without ever logging the password,
 * the vault ciphertext or the recovered seed phrase.
 */
const logParseVaultValueFailure = (error: unknown, reason: string): void => {
  Logger.error(error instanceof Error ? error : new Error(String(error)), {
    context: 'parseVaultValue',
    reason,
  });
};

/**
 * This method validates and decrypts a raw vault. Only works with iOS/Android vaults!
 * The extension uses different cryptography for the vault.
 * @param {string} password - users password related to vault
 * @param {string} vault - exported from ios/android filesystem
 * @returns seed phrase from vault
 */
export const parseVaultValue = async (
  password: string,
  vault: string,
): Promise<string | undefined> => {
  let vaultSeed: string | undefined;

  const serializedVault = vault.trim();

  if (serializedVault.startsWith('{')) {
    let seedObject;
    try {
      seedObject = JSON.parse(serializedVault);
    } catch (error) {
      logParseVaultValueFailure(error, 'vault_json_parse_failed');
      return undefined;
    }

    if (
      seedObject?.cipher &&
      seedObject?.salt &&
      seedObject?.iv &&
      seedObject?.lib
    ) {
      try {
        const encryptor = new Encryptor({
          keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
        });
        const result = (await encryptor.decrypt(password, serializedVault)) as {
          data?: { mnemonic?: string };
        }[];
        vaultSeed = result[0]?.data?.mnemonic;
        if (!vaultSeed) {
          logParseVaultValueFailure(
            new Error('Decrypted vault contained no mnemonic'),
            'vault_mnemonic_missing',
          );
        }
      } catch (error) {
        logParseVaultValueFailure(error, 'vault_decrypt_failed');
      }
    } else {
      logParseVaultValueFailure(
        new Error('Vault is missing required encryption fields'),
        'vault_shape_invalid',
      );
    }
  }
  return vaultSeed;
};

export const parseSeedPhrase = (seedPhrase: string): string =>
  (seedPhrase || '').trim().toLowerCase().match(regex.seedPhrase)?.join(' ') ||
  '';

export const { isValidMnemonic } = ethers.utils;
