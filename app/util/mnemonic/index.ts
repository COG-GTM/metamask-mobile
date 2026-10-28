import { wordlist as englishWordlist } from '@metamask/scure-bip39/dist/wordlists/english';

/**
 * Method to shuffles an array of string.
 *
 * The previous method was replaced according to the following tutorial.
 * https://javascript.info/array-methods#shuffle-an-array
 *
 * @param array - Array of string.
 * @returns Array of string.
 */

export const shuffle = (array: string[]): string[] => {
  const shuffledArray = [...array];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements.
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

/**
 * Compare two mnemonics arrays.
 * @param validMnemonic - Array of string with the correct SRP.
 * @param input - Array of string with the user's input.
 * @returns Boolean indicating with the input matches the valid SRP.
 */
export const compareMnemonics = (
  validMnemonic: string[],
  input: string[],
): boolean => validMnemonic.join('') === input.join('');

/**
 * Transform a typed array containing mnemonic data to the seed phrase.
 * @param uint8Array - Typed array containing mnemonic data.
 * @param wordlist - BIP-39 wordlist.
 * @returns The seed phrase.
 */
export const uint8ArrayToMnemonic = (
  uint8Array: Uint8Array,
  wordlist: string[],
): string => {
  if (uint8Array.length === 0) {
    throw new Error(
      'The method uint8ArrayToMnemonic expects a non-empty array',
    );
  }

  const recoveredIndices = Array.from(
    new Uint16Array(new Uint8Array(uint8Array).buffer),
  );

  return recoveredIndices.map((i) => wordlist[i]).join(' ');
};

const BIP39_WORDS = new Set(englishWordlist);
const MIN_SRP_WORD_COUNT = 12;

const toWordTokens = (text: unknown): string[] =>
  String(text ?? '')
    .toLowerCase()
    .match(/[a-z]+/g) ?? [];

const longestBip39Run = (tokens: string[]): number => {
  let longest = 0;
  let current = 0;
  for (const token of tokens) {
    // BIP-39 words have at least 3 letters; shorter tokens are list markers.
    if (token.length < 3) continue;
    current = BIP39_WORDS.has(token) ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
};

const longestInOrderMatch = (tokens: string[], words: string[]): number => {
  const previous = new Array(words.length + 1).fill(0);
  for (const token of tokens) {
    let diagonal = 0;
    for (let j = 1; j <= words.length; j++) {
      const above = previous[j];
      previous[j] =
        token === words[j - 1]
          ? diagonal + 1
          : Math.max(previous[j], previous[j - 1]);
      diagonal = above;
    }
  }
  return previous[words.length];
};

/**
 * Detects whether a password hint contains a Secret Recovery Phrase, so it must not
 * be stored (hints are kept in plain, unencrypted storage).
 *
 * The hint is rejected when it holds a run of at least 12 BIP-39 words (case,
 * numbering and punctuation are ignored) or, when the SRP is known, when it
 * contains more than half of the SRP's words in order.
 * @param hint - The hint entered by the user.
 * @param srpWords - The words of the user's SRP, when available.
 * @returns Boolean indicating whether the hint must not be stored.
 */
export const isHintSeedPhrase = (
  hint: string,
  srpWords?: string[],
): boolean => {
  const tokens = toWordTokens(hint);
  if (tokens.length === 0) return false;
  if (longestBip39Run(tokens) >= MIN_SRP_WORD_COUNT) return true;
  const words = (srpWords ?? []).flatMap(toWordTokens);
  if (words.length === 0) return false;
  return longestInOrderMatch(tokens, words) > words.length / 2;
};
