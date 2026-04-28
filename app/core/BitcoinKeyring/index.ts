///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
import { BitcoinKeyring } from './BitcoinKeyring';

export { BitcoinKeyring };
export type { BitcoinKeyringState, BitcoinKeyringAccount } from './types';
export { BitcoinNetwork } from './types';

/**
 * Creates a builder function for the Bitcoin HD keyring.
 *
 * The builder follows the same pattern used by other keyring builders
 * registered with the `KeyringController` (see QR, Ledger, HD).
 *
 * @returns A builder function with the required `.type` property.
 */
export function bitcoinKeyringBuilder(): {
  (): BitcoinKeyring;
  type: string;
} {
  const builder = () => new BitcoinKeyring();
  builder.type = BitcoinKeyring.type;
  return builder;
}
///: END:ONLY_INCLUDE_IF
