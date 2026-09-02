declare module '@metamask/ethjs-query' {
  import type EthQuery from '@metamask/eth-query';

  const Eth: new (provider: unknown) => EthQuery;
  export default Eth;
}
