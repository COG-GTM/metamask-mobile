/**
 * Decimal-string chain IDs of the built-in networks keyed by legacy provider
 * `type`, as exported by `@metamask/controller-utils` (`NetworksChainId`) when
 * migrations 003/004/015 were written.
 */
export const LEGACY_NETWORKS_CHAIN_ID = {
  mainnet: '1',
  ropsten: '3',
  rinkeby: '4',
  goerli: '5',
  kovan: '42',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-mainnet': '59144',
  rpc: '',
  localhost: '',
} as const;
