import { ethers } from 'ethers';
import { isValidMnemonic } from '../validators';

export const SECRET_QR_CODE_ERROR = 'SECRET_QR_CODE_NOT_ALLOWED';

const PRIVATE_KEY_REGEX = /^(0x)?[0-9a-f]{64}$/iu;
const MNEMONIC_LENGTHS = [12, 15, 18, 21, 24];
const MAX_SCANNED_WORDS = 512;

const isBip39Word = (word: string): boolean =>
  ethers.wordlists.en.getWordIndex(word) >= 0;

const isPrivateKey = (value: unknown): boolean =>
  typeof value === 'string' && PRIVATE_KEY_REGEX.test(value.trim());

const containsPrivateKey = (text: string): boolean =>
  text.split(/[^0-9a-z]+/iu).some((token) => PRIVATE_KEY_REGEX.test(token));

const isMnemonicWindow = (words: string[]): boolean => {
  try {
    return isValidMnemonic(words.join(' '));
  } catch {
    return false;
  }
};

// Looks for a valid BIP-39 phrase anywhere in the text, so labelled or
// wrapped phrases ("seed: word word ...") are caught as well.
const containsMnemonic = (text: string): boolean => {
  const words = (text.toLowerCase().match(/[a-z]+/gu) || []).slice(
    0,
    MAX_SCANNED_WORDS,
  );
  let run: string[] = [];
  const checkRun = () =>
    MNEMONIC_LENGTHS.some((length) => {
      for (let start = 0; start + length <= run.length; start++) {
        if (isMnemonicWindow(run.slice(start, start + length))) return true;
      }
      return false;
    });
  for (const word of words) {
    if (isBip39Word(word)) {
      run.push(word);
      continue;
    }
    if (run.length >= MNEMONIC_LENGTHS[0] && checkRun()) return true;
    run = [];
  }
  return run.length >= MNEMONIC_LENGTHS[0] && checkRun();
};

/**
 * Returns true when scanned QR text holds a Secret Recovery Phrase, a raw
 * private key or a WalletConnect pairing URI, none of which may be handed to
 * an untrusted caller such as a dapp.
 */
export const isSecretQRContent = (content: unknown): boolean => {
  if (typeof content !== 'string') return false;
  return (
    content.includes('wc:') ||
    containsPrivateKey(content) ||
    containsMnemonic(content)
  );
};

/**
 * Returns true when a QR scanner result (parsed object and/or raw text)
 * contains secret wallet data.
 */
export const containsSecretQRData = (
  data: unknown,
  content?: unknown,
): boolean => {
  if (isSecretQRContent(content) || isSecretQRContent(data)) return true;
  if (data && typeof data === 'object') {
    const { seed, private_key, walletConnectURI } = data as Record<
      string,
      unknown
    >;
    return (
      seed !== undefined ||
      walletConnectURI !== undefined ||
      isPrivateKey(private_key)
    );
  }
  return false;
};
