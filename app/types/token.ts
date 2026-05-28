/**
 * Token types for the MetaMask Mobile app.
 *
 * These types provide shared interfaces for token representations
 * used across UI components, selectors, and utility functions.
 */

/**
 * Standard ERC-20 token representation used across the app.
 */
export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  image?: string;
  name?: string;
  isERC721?: boolean;
  aggregators?: string[];
}

/**
 * Token with balance and fiat conversion information.
 */
export interface TokenWithBalance extends Token {
  balance: string;
  balanceFiat?: string;
}
