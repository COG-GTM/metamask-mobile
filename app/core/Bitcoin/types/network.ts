/**
 * Bitcoin network configuration types.
 *
 * Defines the supported Bitcoin networks and their configuration,
 * following CAIP-2 chain ID conventions already used by the
 * MultichainNetworkController.
 */

import { CaipChainId } from '@metamask/utils';

/**
 * Supported Bitcoin network identifiers using CAIP-2 format.
 *
 * These align with the existing `BtcScope` values from `@metamask/keyring-api`:
 * - `BtcScope.Mainnet` = `'bip122:000000000019d6689c085ae165831e93'`
 * - `BtcScope.Testnet` = `'bip122:000000000933ea01ad0ee984209779ba'`
 *
 * We extend with signet and regtest for developer workflows.
 */
export enum BitcoinNetworkId {
  Mainnet = 'bip122:000000000019d6689c085ae165831e93',
  Testnet = 'bip122:000000000933ea01ad0ee984209779ba',
  Signet = 'bip122:00000008819873e925422c1ff0f99f7c',
  Regtest = 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
}

/**
 * Bitcoin network type for runtime branching (e.g., fee estimation strategies).
 */
export enum BitcoinNetworkType {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Signet = 'signet',
  Regtest = 'regtest',
}

/**
 * Maps a CAIP-2 Bitcoin chain ID to its human-readable network type.
 */
export const BITCOIN_NETWORK_ID_TO_TYPE: Record<
  BitcoinNetworkId,
  BitcoinNetworkType
> = {
  [BitcoinNetworkId.Mainnet]: BitcoinNetworkType.Mainnet,
  [BitcoinNetworkId.Testnet]: BitcoinNetworkType.Testnet,
  [BitcoinNetworkId.Signet]: BitcoinNetworkType.Signet,
  [BitcoinNetworkId.Regtest]: BitcoinNetworkType.Regtest,
};

/**
 * Static configuration for a Bitcoin network.
 */
export interface BitcoinNetworkConfig {
  /** CAIP-2 chain identifier. */
  chainId: CaipChainId;

  /** Human-readable network type. */
  type: BitcoinNetworkType;

  /** Display name shown in the UI. */
  displayName: string;

  /** Native currency ticker symbol. */
  ticker: string;

  /** Number of decimal places for the native currency (BTC = 8). */
  decimals: number;

  /** Whether this network uses real funds. */
  isProduction: boolean;

  /** Default fee rate source URL (e.g. mempool.space API). */
  feeRateApiUrl: string;

  /** Block explorer base URL. */
  blockExplorerUrl: string;

  /** Block explorer format URL for addresses. */
  blockExplorerAddressUrl: string;

  /** Block explorer format URL for transactions. */
  blockExplorerTxUrl: string;
}

/**
 * Pre-defined Bitcoin network configurations.
 */
export const BITCOIN_NETWORKS: Record<BitcoinNetworkId, BitcoinNetworkConfig> = {
  [BitcoinNetworkId.Mainnet]: {
    chainId: BitcoinNetworkId.Mainnet,
    type: BitcoinNetworkType.Mainnet,
    displayName: 'Bitcoin Mainnet',
    ticker: 'BTC',
    decimals: 8,
    isProduction: true,
    feeRateApiUrl: 'https://mempool.space/api/v1/fees/recommended',
    blockExplorerUrl: 'https://mempool.space',
    blockExplorerAddressUrl: 'https://mempool.space/address/{address}',
    blockExplorerTxUrl: 'https://mempool.space/tx/{txId}',
  },
  [BitcoinNetworkId.Testnet]: {
    chainId: BitcoinNetworkId.Testnet,
    type: BitcoinNetworkType.Testnet,
    displayName: 'Bitcoin Testnet',
    ticker: 'tBTC',
    decimals: 8,
    isProduction: false,
    feeRateApiUrl: 'https://mempool.space/testnet/api/v1/fees/recommended',
    blockExplorerUrl: 'https://mempool.space/testnet',
    blockExplorerAddressUrl:
      'https://mempool.space/testnet/address/{address}',
    blockExplorerTxUrl: 'https://mempool.space/testnet/tx/{txId}',
  },
  [BitcoinNetworkId.Signet]: {
    chainId: BitcoinNetworkId.Signet,
    type: BitcoinNetworkType.Signet,
    displayName: 'Bitcoin Signet',
    ticker: 'sBTC',
    decimals: 8,
    isProduction: false,
    feeRateApiUrl: 'https://mempool.space/signet/api/v1/fees/recommended',
    blockExplorerUrl: 'https://mempool.space/signet',
    blockExplorerAddressUrl:
      'https://mempool.space/signet/address/{address}',
    blockExplorerTxUrl: 'https://mempool.space/signet/tx/{txId}',
  },
  [BitcoinNetworkId.Regtest]: {
    chainId: BitcoinNetworkId.Regtest,
    type: BitcoinNetworkType.Regtest,
    displayName: 'Bitcoin Regtest',
    ticker: 'rBTC',
    decimals: 8,
    isProduction: false,
    feeRateApiUrl: '',
    blockExplorerUrl: '',
    blockExplorerAddressUrl: '',
    blockExplorerTxUrl: '',
  },
};
