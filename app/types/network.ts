/**
 * Network and chain types for the MetaMask Mobile app.
 *
 * These types will be populated as network-related files are migrated.
 * They provide shared interfaces for chain IDs, network configurations,
 * and RPC endpoints used across the app.
 */

/**
 * Common network configuration shape used in the app.
 */
export interface NetworkConfig {
  chainId: string;
  nickname: string;
  rpcUrl: string;
  ticker: string;
  blockExplorerUrl?: string;
}

/**
 * Known chain ID constants will be typed via `as const` assertions
 * when app/constants/network.js is migrated.
 */
export type ChainId = string;
