/**
 * Bitcoin address type definitions.
 *
 * Bitcoin supports multiple address formats, each tied to a specific
 * script type and BIP derivation standard. These types allow the UI
 * and controllers to reason about address capabilities.
 */

/**
 * Bitcoin address format / script type.
 *
 * Each format has different fee characteristics, compatibility, and
 * privacy properties.
 */
export enum BitcoinAddressType {
  /** Pay-to-Public-Key-Hash (Legacy). BIP44. Prefix: 1... */
  P2PKH = 'p2pkh',

  /** Pay-to-Script-Hash (Nested SegWit). BIP49. Prefix: 3... */
  P2SH = 'p2sh',

  /** Pay-to-Witness-Public-Key-Hash (Native SegWit). BIP84. Prefix: bc1q... */
  P2WPKH = 'p2wpkh',

  /** Pay-to-Witness-Script-Hash. BIP84 variant. Prefix: bc1q... (longer) */
  P2WSH = 'p2wsh',

  /** Pay-to-Taproot. BIP86. Prefix: bc1p... */
  P2TR = 'p2tr',
}

/**
 * Metadata for a Bitcoin address type.
 */
export interface BitcoinAddressTypeInfo {
  /** Machine identifier. */
  type: BitcoinAddressType;

  /** Display label (e.g. "Native SegWit"). */
  label: string;

  /** Short description of the format. */
  description: string;

  /** BIP standard that defines this address type. */
  bip: 'BIP44' | 'BIP49' | 'BIP84' | 'BIP86';

  /** Mainnet address prefix pattern used for quick identification. */
  mainnetPrefix: string;

  /** Testnet address prefix pattern. */
  testnetPrefix: string;

  /** Whether this type supports SegWit witness discount. */
  isSegWit: boolean;
}

/**
 * Registry of supported Bitcoin address types with metadata.
 */
export const BITCOIN_ADDRESS_TYPES: Record<
  BitcoinAddressType,
  BitcoinAddressTypeInfo
> = {
  [BitcoinAddressType.P2PKH]: {
    type: BitcoinAddressType.P2PKH,
    label: 'Legacy',
    description: 'Original Bitcoin address format (Pay-to-Public-Key-Hash)',
    bip: 'BIP44',
    mainnetPrefix: '1',
    testnetPrefix: 'm',
    isSegWit: false,
  },
  [BitcoinAddressType.P2SH]: {
    type: BitcoinAddressType.P2SH,
    label: 'Nested SegWit',
    description: 'SegWit-compatible wrapped in P2SH for backward compatibility',
    bip: 'BIP49',
    mainnetPrefix: '3',
    testnetPrefix: '2',
    isSegWit: true,
  },
  [BitcoinAddressType.P2WPKH]: {
    type: BitcoinAddressType.P2WPKH,
    label: 'Native SegWit',
    description: 'Native Segregated Witness (bech32) — recommended default',
    bip: 'BIP84',
    mainnetPrefix: 'bc1q',
    testnetPrefix: 'tb1q',
    isSegWit: true,
  },
  [BitcoinAddressType.P2WSH]: {
    type: BitcoinAddressType.P2WSH,
    label: 'Native SegWit (Script)',
    description: 'Pay-to-Witness-Script-Hash for complex scripts',
    bip: 'BIP84',
    mainnetPrefix: 'bc1q',
    testnetPrefix: 'tb1q',
    isSegWit: true,
  },
  [BitcoinAddressType.P2TR]: {
    type: BitcoinAddressType.P2TR,
    label: 'Taproot',
    description: 'Latest Bitcoin upgrade — improved privacy and efficiency',
    bip: 'BIP86',
    mainnetPrefix: 'bc1p',
    testnetPrefix: 'tb1p',
    isSegWit: true,
  },
};

/**
 * A resolved Bitcoin address with its metadata.
 */
export interface BitcoinAddress {
  /** The address string (e.g. "bc1q..."). */
  address: string;

  /** The address format / script type. */
  type: BitcoinAddressType;

  /** BIP32 derivation path that produced this address. */
  derivationPath: string;

  /** The index within the derivation path (address_index). */
  index: number;

  /** Whether this is a change address (internal) vs. receive (external). */
  isChange: boolean;
}
