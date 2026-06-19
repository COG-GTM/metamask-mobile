import { getSecureRandomInt } from '../random';

/**
 * Method to shuffles an array of string.
 *
 * Uses a cryptographically secure RNG for the Fisher-Yates swaps since this is
 * used to shuffle SRP words.
 *
 * @param array - Array of string.
 * @returns Array of string.
 */

export const shuffle = (array: string[]): string[] => {
  const shuffledArray = [...array];
  for (let i = array.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(0, i);

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
