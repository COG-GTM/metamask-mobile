import { ethers } from 'ethers';
import { Encryptor, LEGACY_DERIVATION_OPTIONS } from '../../core/Encryptor';
import { regex } from '../regex';

export const failedSeedPhraseRequirements = (seed: string): boolean => {
  const wordCount = seed.split(/\s/u).length;
  return wordCount % 3 !== 0 || wordCount > 24 || wordCount < 12;
};

/**
 * This method validates and decrypts a raw vault. Only works with iOS/Android vaults!
 * The extension uses different cryptography for the vault.
 * @param {string} password - users password related to vault
 * @param {string} vault - exported from ios/android filesystem
 * @returns seed phrase from vault
 */
export const parseVaultValue = async (password: string, vault: string): Promise<string | undefined> => {
  let vaultSeed: string | undefined;

  if (vault[0] === '{' && vault[vault.length - 1] === '}')
    try {
      const seedObject = JSON.parse(vault);
      if (
        seedObject?.cipher &&
        seedObject?.salt &&
        seedObject?.iv &&
        seedObject?.lib
      ) {
        const encryptor = new Encryptor({
          keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
        });
        const result = await encryptor.decrypt(password, vault) as { data?: { mnemonic?: string } }[];
        vaultSeed = result[0]?.data?.mnemonic;
      }
    } catch (error) {
      //No-op
    }
  return vaultSeed;
};

export const parseSeedPhrase = (seedPhrase: string): string =>
  (seedPhrase || '').trim().toLowerCase().match(regex.seedPhrase)?.join(' ') ||
  '';

export const { isValidMnemonic } = ethers.utils;

const RAW_PRIVATE_KEY_REGEX = /^(0x)?[0-9a-f]{64}$/iu;
const EXTENDED_PRIVATE_KEY_REGEX = /^[tuvxyz]prv[1-9A-HJ-NP-Za-km-z]{100,}$/u;
const NUMBER_ONLY_REGEX = /^\d+$/u;

/**
 * Whether QR content is secret key material: a Secret Recovery Phrase
 * (optionally numbered or oddly spaced), a raw private key or an extended private key.
 *
 * @param content - Raw scanned text.
 * @returns True if the content must be treated as a wallet secret.
 */
export const isSecretKeyMaterial = (content: string): boolean => {
  if (typeof content !== 'string') {
    return false;
  }
  const trimmed = content.trim();
  if (
    RAW_PRIVATE_KEY_REGEX.test(trimmed) ||
    EXTENDED_PRIVATE_KEY_REGEX.test(trimmed)
  ) {
    return true;
  }
  const words = parseSeedPhrase(trimmed)
    .split(' ')
    .filter((word) => !NUMBER_ONLY_REGEX.test(word))
    .join(' ');
  return !failedSeedPhraseRequirements(words) && isValidMnemonic(words);
};

/**
 * Whether QR content is only meant for the wallet itself and must never be
 * returned to a dapp: secret key material, WalletConnect pairing URIs (which
 * carry the pairing symKey) or extension sync payloads.
 *
 * @param content - Raw scanned text.
 * @returns True if the content must not leave the wallet.
 */
export const isWalletOnlyQRContent = (content: string): boolean =>
  typeof content === 'string' &&
  (isSecretKeyMaterial(content) ||
    content.split('wc:').length > 1 ||
    content.split('metamask-sync:').length > 1);
