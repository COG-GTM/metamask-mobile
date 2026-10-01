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

/**
 * Detects whether a password hint contains a Secret Recovery Phrase, i.e. a run
 * of at least 12 consecutive BIP-39 words (ignoring case, numbering and punctuation).
 * @param hint - The hint entered by the user.
 * @returns Boolean indicating whether the hint must not be stored.
 */
export const isHintSeedPhrase = (hint: string): boolean => {
  const tokens =
    String(hint)
      .toLowerCase()
      .match(/[a-z]+/g) ?? [];
  let run = 0;
  for (const token of tokens) {
    run = BIP39_WORDS.has(token) ? run + 1 : 0;
    if (run >= MIN_SRP_WORD_COUNT) return true;
  }
  return false;
};
