import {
  MIN_IN_MS,
  HOUR_IN_MS,
  DAY_IN_MS,
  DEFAULT_SESSION_TIMEOUT_MS,
  TIMEOUT_PAUSE_CONNECTIONS,
  RPC_METHODS,
  CONNECTION_LOADING_EVENT,
  METHODS_TO_REDIRECT,
  METHODS_TO_DELAY,
} from './SDKConnectConstants';

describe('SDKConnectConstants', () => {
  it('MIN_IN_MS is 60000', () => {
    expect(MIN_IN_MS).toBe(60000);
  });

  it('HOUR_IN_MS is 3600000', () => {
    expect(HOUR_IN_MS).toBe(3600000);
  });

  it('DAY_IN_MS is 86400000', () => {
    expect(DAY_IN_MS).toBe(86400000);
  });

  it('DEFAULT_SESSION_TIMEOUT_MS is 30 days', () => {
    expect(DEFAULT_SESSION_TIMEOUT_MS).toBe(30 * DAY_IN_MS);
  });

  it('TIMEOUT_PAUSE_CONNECTIONS is 25000', () => {
    expect(TIMEOUT_PAUSE_CONNECTIONS).toBe(25000);
  });

  it('RPC_METHODS contains expected methods', () => {
    expect(RPC_METHODS.PERSONAL_SIGN).toBe('personal_sign');
    expect(RPC_METHODS.ETH_REQUESTACCOUNTS).toBe('eth_requestAccounts');
    expect(RPC_METHODS.ETH_SENDTRANSACTION).toBe('eth_sendTransaction');
    expect(RPC_METHODS.ETH_CHAINID).toBe('eth_chainId');
    expect(RPC_METHODS.WALLET_WATCHASSET).toBe('wallet_watchAsset');
    expect(RPC_METHODS.WALLET_ADDETHEREUMCHAIN).toBe('wallet_addEthereumChain');
    expect(RPC_METHODS.WALLET_SWITCHETHEREUMCHAIN).toBe('wallet_switchEthereumChain');
    expect(RPC_METHODS.METAMASK_CONNECTSIGN).toBe('metamask_connectSign');
    expect(RPC_METHODS.METAMASK_BATCH).toBe('metamask_batch');
  });

  it('CONNECTION_LOADING_EVENT is loading', () => {
    expect(CONNECTION_LOADING_EVENT).toBe('loading');
  });

  it('METHODS_TO_REDIRECT contains redirect methods', () => {
    expect(METHODS_TO_REDIRECT[RPC_METHODS.ETH_REQUESTACCOUNTS]).toBe(true);
    expect(METHODS_TO_REDIRECT[RPC_METHODS.ETH_SENDTRANSACTION]).toBe(true);
    expect(METHODS_TO_REDIRECT[RPC_METHODS.PERSONAL_SIGN]).toBe(true);
    expect(METHODS_TO_REDIRECT[RPC_METHODS.METAMASK_CONNECTSIGN]).toBe(true);
  });

  it('METHODS_TO_DELAY extends METHODS_TO_REDIRECT but ETH_REQUESTACCOUNTS is false', () => {
    expect(METHODS_TO_DELAY[RPC_METHODS.ETH_REQUESTACCOUNTS]).toBe(false);
    expect(METHODS_TO_DELAY[RPC_METHODS.PERSONAL_SIGN]).toBe(true);
  });
});
