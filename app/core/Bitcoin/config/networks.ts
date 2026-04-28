import { BtcScope } from '@metamask/keyring-api';

/**
 * Bitcoin network types supported for development and testing.
 */
export enum BitcoinNetworkType {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Signet = 'signet',
  Regtest = 'regtest',
}

/**
 * Configuration for a Bitcoin API endpoint.
 */
export interface BitcoinApiEndpoint {
  name: string;
  baseUrl: string;
  network: BitcoinNetworkType;
  docs?: string;
}

/**
 * Public Blockstream API endpoints for Bitcoin.
 * See: https://github.com/Blockstream/esplora/blob/master/API.md
 */
export const BLOCKSTREAM_API_ENDPOINTS: Record<string, BitcoinApiEndpoint> = {
  mainnet: {
    name: 'Blockstream Mainnet',
    baseUrl: 'https://blockstream.info/api',
    network: BitcoinNetworkType.Mainnet,
    docs: 'https://github.com/Blockstream/esplora/blob/master/API.md',
  },
  testnet: {
    name: 'Blockstream Testnet',
    baseUrl: 'https://blockstream.info/testnet/api',
    network: BitcoinNetworkType.Testnet,
    docs: 'https://github.com/Blockstream/esplora/blob/master/API.md',
  },
} as const;

/**
 * Public Mempool.space API endpoints for Bitcoin.
 * See: https://mempool.space/docs/api/rest
 */
export const MEMPOOL_API_ENDPOINTS: Record<string, BitcoinApiEndpoint> = {
  mainnet: {
    name: 'Mempool.space Mainnet',
    baseUrl: 'https://mempool.space/api',
    network: BitcoinNetworkType.Mainnet,
    docs: 'https://mempool.space/docs/api/rest',
  },
  testnet: {
    name: 'Mempool.space Testnet',
    baseUrl: 'https://mempool.space/testnet/api',
    network: BitcoinNetworkType.Testnet,
    docs: 'https://mempool.space/docs/api/rest',
  },
  signet: {
    name: 'Mempool.space Signet',
    baseUrl: 'https://mempool.space/signet/api',
    network: BitcoinNetworkType.Signet,
    docs: 'https://mempool.space/docs/api/rest',
  },
} as const;

/**
 * Default API endpoints used for Bitcoin development.
 * Blockstream is the primary, Mempool.space is the fallback.
 */
export const DEFAULT_BITCOIN_TESTNET_API = BLOCKSTREAM_API_ENDPOINTS.testnet;
export const DEFAULT_BITCOIN_SIGNET_API = MEMPOOL_API_ENDPOINTS.signet;

/**
 * CAIP-2 chain identifiers for Bitcoin networks,
 * aligned with the existing MetaMask multichain framework.
 */
export const BITCOIN_CAIP2_CHAIN_IDS = {
  mainnet: BtcScope.Mainnet,
  testnet: BtcScope.Testnet,
} as const;

/**
 * Bitcoin testnet faucet URLs for requesting test BTC.
 */
export const BITCOIN_TESTNET_FAUCETS = [
  {
    name: 'Bitcoin Testnet Faucet (coinfaucet.eu)',
    url: 'https://coinfaucet.eu/en/btc-testnet/',
    network: BitcoinNetworkType.Testnet,
    automated: false,
  },
  {
    name: 'Bitcoin Signet Faucet (signetfaucet.com)',
    url: 'https://signetfaucet.com/',
    network: BitcoinNetworkType.Signet,
    automated: false,
  },
  {
    name: 'Mempool Signet Faucet',
    url: 'https://mempool.space/signet/faucet',
    network: BitcoinNetworkType.Signet,
    automated: false,
  },
] as const;

/**
 * Bitcoin address format prefixes for validation.
 */
export const BITCOIN_ADDRESS_PREFIXES = {
  mainnet: {
    p2pkh: '1',
    p2sh: '3',
    bech32: 'bc1',
  },
  testnet: {
    p2pkh: ['m', 'n'],
    p2sh: '2',
    bech32: 'tb1',
  },
  signet: {
    p2pkh: ['m', 'n'],
    p2sh: '2',
    bech32: 'tb1',
  },
  regtest: {
    p2pkh: ['m', 'n'],
    p2sh: '2',
    bech32: 'bcrt1',
  },
} as const;

/**
 * Minimum confirmations considered safe for different Bitcoin networks.
 */
export const BITCOIN_CONFIRMATION_THRESHOLDS = {
  [BitcoinNetworkType.Mainnet]: 6,
  [BitcoinNetworkType.Testnet]: 1,
  [BitcoinNetworkType.Signet]: 1,
  [BitcoinNetworkType.Regtest]: 1,
} as const;

/**
 * Satoshis per BTC (1 BTC = 100,000,000 satoshis).
 */
export const SATOSHIS_PER_BTC = 100_000_000;

/**
 * Minimum relay fee in satoshis per byte (typical).
 */
export const MIN_RELAY_FEE_SAT_PER_BYTE = 1;
