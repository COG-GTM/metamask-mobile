/**
 * Decimal chain IDs of the networks built into the app at the time migrations
 * 3, 4 and 15 were written.
 *
 * This replaces the `NetworksChainId` constant that used to be exported by
 * `@metamask/controller-utils`, which has since been removed.
 */
export const NETWORKS_CHAIN_ID = {
  mainnet: '1',
  kovan: '42',
  rinkeby: '4',
  goerli: '5',
  ropsten: '3',
  localhost: '',
  rpc: '',
} as const;
