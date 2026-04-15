import Crypto from 'react-native-quick-crypto';

/**
 * Generates a random byte array of the specified size.
 * @param size - The size of the byte array to generate.
 * @returns A Uint8Array of random bytes.
 */
export function getRandomBytes(size) {
  return Crypto.getRandomValues(new Uint8Array(size));
}