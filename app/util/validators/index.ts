import { ed25519 } from '@metamask/key-tree';
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
 * Decodes base58 text to bytes.
 *
 * @param text - Base58 text (alphabet already validated).
 * @returns Decoded bytes.
 */
const decodeBase58 = (text: string): Uint8Array => {
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
  for (let i = 0; text[i] === '1'; i++) bytes.push(0);
  return Uint8Array.from(bytes.reverse());
};

/**
 * Whether bytes form a 64-byte ed25519 keypair (32-byte seed followed by its
 * public key), as exported by Solana wallets. Signatures share the length but
 * not this structure.
 *
 * @param bytes - Candidate keypair bytes.
 * @returns True if the second half is the public key of the first half.
 */
const isSolanaKeypair = (bytes: Uint8Array): boolean => {
  if (bytes.length !== SOLANA_KEYPAIR_LENGTH) {
    return false;
  }
  const publicKey = ed25519
    .getPublicKey(bytes.slice(0, SOLANA_KEYPAIR_LENGTH / 2))
    .slice(-SOLANA_KEYPAIR_LENGTH / 2);
  return publicKey.every(
    (byte, i) => byte === bytes[SOLANA_KEYPAIR_LENGTH / 2 + i],
  );
};

/**
 * Whether the text contains a Solana keypair secret, either base58 encoded
 * (wallet export format) or as a JSON byte array (solana-keygen file).
 *
 * @param text - Text to inspect.
 * @returns True if a keypair is present.
 */
const containsSolanaKeypair = (text: string): boolean =>
  Array.from(text.matchAll(BASE58_TOKEN_REGEX)).some(([token]) =>
    isSolanaKeypair(decodeBase58(token)),
  ) ||
  Array.from(text.matchAll(BYTE_ARRAY_REGEX)).some(([array]) => {
    const values = (array.match(/\d+/gu) ?? []).map(Number);
    return (
      values.every((value) => value <= 255) &&
      isSolanaKeypair(Uint8Array.from(values))
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
