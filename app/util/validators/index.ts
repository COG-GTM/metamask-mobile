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
const EMBEDDED_PRIVATE_KEY_REGEX = /(?:^|[^0-9a-z])(?:0x)?[0-9a-f]{64}(?![0-9a-z])/iu;
const EXTENDED_PRIVATE_KEY_REGEX = /[tuvxyz]prv[1-9A-HJ-NP-Za-km-z]{100,}/u;
const NUMBER_ONLY_REGEX = /^\d+$/u;
const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_TOKEN_REGEX = /[1-9A-HJ-NP-Za-km-z]{80,96}/gu;
const BYTE_ARRAY_REGEX = /\[\s*\d{1,3}(?:\s*,\s*\d{1,3})*\s*,?\s*\]/gu;
const SOLANA_KEYPAIR_LENGTH = 64;
const MNEMONIC_LENGTHS = [12, 15, 18, 21, 24];

/**
 * Number of bytes a base58 string decodes to.
 *
 * @param text - Base58 text (alphabet already validated).
 * @returns Decoded byte length.
 */
const base58ByteLength = (text: string): number => {
  const bytes: number[] = [];
  for (const char of text) {
    let carry = BASE58_ALPHABET.indexOf(char);
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  let leadingZeros = 0;
  while (text[leadingZeros] === '1') leadingZeros++;
  return bytes.length + leadingZeros;
};

/**
 * Whether the text contains a 64-byte Solana keypair secret, either base58
 * encoded (wallet export format) or as a JSON byte array (solana-keygen file).
 *
 * @param text - Text to inspect.
 * @returns True if a 64-byte keypair is present.
 */
const containsSolanaKeypair = (text: string): boolean =>
  Array.from(text.matchAll(BASE58_TOKEN_REGEX)).some(
    ([token]) => base58ByteLength(token) === SOLANA_KEYPAIR_LENGTH,
  ) ||
  Array.from(text.matchAll(BYTE_ARRAY_REGEX)).some(([array]) => {
    const values = array.match(/\d+/gu) ?? [];
    return (
      values.length === SOLANA_KEYPAIR_LENGTH &&
      values.every((value) => Number(value) <= 255)
    );
  });

/**
 * Whether the text contains a BIP-39 (English) mnemonic anywhere, e.g. wrapped
 * in labels ("Secret Recovery Phrase: ..."), JSON or numbered lists.
 *
 * @param text - Text to inspect.
 * @returns True if any run of consecutive wordlist words forms a valid mnemonic.
 */
const containsMnemonic = (text: string): boolean => {
  const tokens = text.toLowerCase().split(/[^a-z]+/u).filter(Boolean);
  const runs: string[][] = [];
  let run: string[] = [];
  for (const token of tokens) {
    if (ethers.wordlists.en.getWordIndex(token) !== -1) {
      run.push(token);
    } else {
      runs.push(run);
      run = [];
    }
  }
  runs.push(run);
  return runs.some((words) =>
    MNEMONIC_LENGTHS.some((length) => {
      for (let start = 0; start + length <= words.length; start++) {
        if (isValidMnemonic(words.slice(start, start + length).join(' '))) {
          return true;
        }
      }
      return false;
    }),
  );
};

/**
 * Whether QR content contains secret key material: a Secret Recovery Phrase
 * (bare, numbered, labelled or oddly spaced), a raw private key, an extended
 * private key or a Solana keypair.
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
    EMBEDDED_PRIVATE_KEY_REGEX.test(trimmed) ||
    EXTENDED_PRIVATE_KEY_REGEX.test(trimmed) ||
    containsSolanaKeypair(trimmed)
  ) {
    return true;
  }
  const words = parseSeedPhrase(trimmed)
    .split(' ')
    .filter((word) => !NUMBER_ONLY_REGEX.test(word))
    .join(' ');
  return (
    (!failedSeedPhraseRequirements(words) && isValidMnemonic(words)) ||
    containsMnemonic(trimmed)
  );
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
