/**
 * Converts bytes length to bits length
 *
 * @param bytesLength - Bytes length to convert
 * @returns Bits length
 */
export function bytesLengthToBitsLength(bytesLength: number): number {
  return bytesLength * 8;
}
