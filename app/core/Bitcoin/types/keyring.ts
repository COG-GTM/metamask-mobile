/**
 * Bitcoin key derivation types.
 *
 * Bitcoin HD wallets follow a hierarchical derivation scheme defined by
 * BIP32, with purpose levels defined by BIP43/44/49/84/86. MetaMask
 * derives Bitcoin keys from the same master seed (SRP) as Ethereum keys,
 * using the Bitcoin-specific purpose and coin-type path segments.
 *
 * The actual key derivation is handled by the Bitcoin Wallet Snap
 * (`@metamask/bitcoin-wallet-snap`) via the SnapKeyring. These types
 * define the contracts for derivation path configuration and the
 * interface between the Snap and the MetaMask controllers.
 */

import { BitcoinAddressType } from './address';
import { BitcoinNetworkType } from './network';

/**
 * BIP44 coin type constants.
 *
 * @see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 */
export enum BitcoinCoinType {
  /** Bitcoin mainnet coin type. */
  Mainnet = 0,

  /** Bitcoin testnet coin type (shared across testnet, signet, regtest). */
  Testnet = 1,
}

/**
 * BIP43 purpose constants for Bitcoin address types.
 */
export enum BitcoinDerivationPurpose {
  /** BIP44 — Legacy P2PKH. */
  BIP44 = 44,

  /** BIP49 — Nested SegWit P2SH-P2WPKH. */
  BIP49 = 49,

  /** BIP84 — Native SegWit P2WPKH (default for MetaMask). */
  BIP84 = 84,

  /** BIP86 — Taproot P2TR. */
  BIP86 = 86,
}

/**
 * Maps address types to their BIP43 purpose.
 */
export const ADDRESS_TYPE_TO_PURPOSE: Record<
  BitcoinAddressType,
  BitcoinDerivationPurpose
> = {
  [BitcoinAddressType.P2PKH]: BitcoinDerivationPurpose.BIP44,
  [BitcoinAddressType.P2SH]: BitcoinDerivationPurpose.BIP49,
  [BitcoinAddressType.P2WPKH]: BitcoinDerivationPurpose.BIP84,
  [BitcoinAddressType.P2WSH]: BitcoinDerivationPurpose.BIP84,
  [BitcoinAddressType.P2TR]: BitcoinDerivationPurpose.BIP86,
};

/**
 * Full BIP32 derivation path configuration for a Bitcoin account.
 *
 * Path format: `m / purpose' / coin_type' / account'`
 *
 * Individual addresses are derived as:
 * - Receive: `m / purpose' / coin_type' / account' / 0 / index`
 * - Change:  `m / purpose' / coin_type' / account' / 1 / index`
 */
export interface BitcoinDerivationPath {
  /** BIP43 purpose level (44, 49, 84, or 86). */
  purpose: BitcoinDerivationPurpose;

  /** SLIP-44 coin type (0 for mainnet, 1 for testnet). */
  coinType: BitcoinCoinType;

  /** Account index (hardened). */
  account: number;

  /** Address type this path derives. */
  addressType: BitcoinAddressType;
}

/**
 * Maps network type to the SLIP-44 coin type.
 */
export const NETWORK_TO_COIN_TYPE: Record<BitcoinNetworkType, BitcoinCoinType> =
  {
    mainnet: BitcoinCoinType.Mainnet,
    testnet: BitcoinCoinType.Testnet,
    signet: BitcoinCoinType.Testnet,
    regtest: BitcoinCoinType.Testnet,
  };

/**
 * Default derivation paths for each address type on mainnet.
 *
 * These are the standard paths used by most Bitcoin wallets.
 * The current MetaMask Bitcoin Snap uses BIP84 (Native SegWit) by default,
 * matching `BtcAccountType.P2wpkh` from `@metamask/keyring-api`.
 */
export const DEFAULT_DERIVATION_PATHS: Record<
  BitcoinAddressType,
  BitcoinDerivationPath
> = {
  [BitcoinAddressType.P2PKH]: {
    purpose: BitcoinDerivationPurpose.BIP44,
    coinType: BitcoinCoinType.Mainnet,
    account: 0,
    addressType: BitcoinAddressType.P2PKH,
  },
  [BitcoinAddressType.P2SH]: {
    purpose: BitcoinDerivationPurpose.BIP49,
    coinType: BitcoinCoinType.Mainnet,
    account: 0,
    addressType: BitcoinAddressType.P2SH,
  },
  [BitcoinAddressType.P2WPKH]: {
    purpose: BitcoinDerivationPurpose.BIP84,
    coinType: BitcoinCoinType.Mainnet,
    account: 0,
    addressType: BitcoinAddressType.P2WPKH,
  },
  [BitcoinAddressType.P2WSH]: {
    purpose: BitcoinDerivationPurpose.BIP84,
    coinType: BitcoinCoinType.Mainnet,
    account: 0,
    addressType: BitcoinAddressType.P2WSH,
  },
  [BitcoinAddressType.P2TR]: {
    purpose: BitcoinDerivationPurpose.BIP86,
    coinType: BitcoinCoinType.Mainnet,
    account: 0,
    addressType: BitcoinAddressType.P2TR,
  },
};

/**
 * Builds the string representation of a BIP32 derivation path.
 *
 * @param path - The derivation path components.
 * @returns The path string, e.g. "m/84'/0'/0'".
 */
export function formatDerivationPath(path: BitcoinDerivationPath): string {
  return `m/${path.purpose}'/${path.coinType}'/${path.account}'`;
}

/**
 * Builds the full address derivation path including chain and index.
 *
 * @param basePath - The account-level derivation path.
 * @param isChange - Whether this is a change (internal) address.
 * @param index - The address index.
 * @returns Full path, e.g. "m/84'/0'/0'/0/0".
 */
export function formatAddressDerivationPath(
  basePath: BitcoinDerivationPath,
  isChange: boolean,
  index: number,
): string {
  const chain = isChange ? 1 : 0;
  return `${formatDerivationPath(basePath)}/${chain}/${index}`;
}
