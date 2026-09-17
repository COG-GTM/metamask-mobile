import AppConstants from '../../../core/AppConstants';

/**
 * Historical mapping from network type to its decimal chain ID.
 *
 * This used to be provided by `@metamask/controller-utils` as the
 * `NetworksChainId` constant, which was removed upstream in a breaking change.
 * These legacy migrations still operate on pre-hexadecimal persisted state that
 * relies on the original decimal chain IDs, so the values are preserved here.
 */
export const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  ropsten: '3',
  rinkeby: '4',
  goerli: '5',
  kovan: '42',
  rpc: '',
};

/**
 * Reimplementation of the original `isSafeChainId` helper that used to live in
 * `app/util/networks`. It was removed when chain IDs moved to the hexadecimal
 * format, but these legacy migrations still depend on its decimal semantics.
 *
 * @param chainId - The chain ID to validate.
 * @returns Whether the given chain ID is safe.
 */
export const isSafeChainId = (chainId: number): boolean =>
  Number.isSafeInteger(chainId) &&
  chainId > 0 &&
  chainId <= AppConstants.MAX_SAFE_CHAIN_ID;
