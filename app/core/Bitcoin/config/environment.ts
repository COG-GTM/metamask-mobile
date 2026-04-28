/**
 * Environment variable names for Bitcoin development configuration.
 * These should be added to .js.env when working on Bitcoin features.
 *
 * See docs/bitcoin-dev-setup.md for full configuration guide.
 */
export const BITCOIN_ENV_VARS = {
  /**
   * Primary Bitcoin API base URL (Blockstream Esplora format).
   * Default: https://blockstream.info/testnet/api
   */
  BITCOIN_API_URL: 'MM_BITCOIN_API_URL',

  /**
   * Fallback Bitcoin API base URL (Mempool.space format).
   * Default: https://mempool.space/testnet/api
   */
  BITCOIN_FALLBACK_API_URL: 'MM_BITCOIN_FALLBACK_API_URL',

  /**
   * Bitcoin network to use: 'testnet' | 'signet' | 'regtest'.
   * Default: testnet
   */
  BITCOIN_NETWORK: 'MM_BITCOIN_NETWORK',

  /**
   * Enable verbose logging for Bitcoin-related operations.
   * Default: false
   */
  BITCOIN_DEBUG: 'MM_BITCOIN_DEBUG',
} as const;

/**
 * Default values for Bitcoin environment variables.
 */
export const BITCOIN_ENV_DEFAULTS: Record<string, string> = {
  [BITCOIN_ENV_VARS.BITCOIN_API_URL]:
    'https://blockstream.info/testnet/api',
  [BITCOIN_ENV_VARS.BITCOIN_FALLBACK_API_URL]:
    'https://mempool.space/testnet/api',
  [BITCOIN_ENV_VARS.BITCOIN_NETWORK]: 'testnet',
  [BITCOIN_ENV_VARS.BITCOIN_DEBUG]: 'false',
};
