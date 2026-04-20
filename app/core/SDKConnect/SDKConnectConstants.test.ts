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
  describe('time constants', () => {
    it('defines MIN_IN_MS / HOUR_IN_MS / DAY_IN_MS correctly', () => {
      expect(MIN_IN_MS).toBe(60 * 1000);
      expect(HOUR_IN_MS).toBe(60 * MIN_IN_MS);
      expect(DAY_IN_MS).toBe(24 * HOUR_IN_MS);
    });

    it('defines DEFAULT_SESSION_TIMEOUT_MS as 30 days', () => {
      expect(DEFAULT_SESSION_TIMEOUT_MS).toBe(30 * DAY_IN_MS);
    });

    it('defines TIMEOUT_PAUSE_CONNECTIONS and CONNECTION_LOADING_EVENT', () => {
      expect(TIMEOUT_PAUSE_CONNECTIONS).toBe(25000);
      expect(CONNECTION_LOADING_EVENT).toBe('loading');
    });
  });

  describe('RPC_METHODS', () => {
    it('exposes expected ethereum methods', () => {
      expect(RPC_METHODS.ETH_REQUESTACCOUNTS).toBe('eth_requestAccounts');
      expect(RPC_METHODS.ETH_SENDTRANSACTION).toBe('eth_sendTransaction');
      expect(RPC_METHODS.PERSONAL_SIGN).toBe('personal_sign');
      expect(RPC_METHODS.ETH_CHAINID).toBe('eth_chainId');
    });

    it('exposes expected wallet methods', () => {
      expect(RPC_METHODS.WALLET_ADDETHEREUMCHAIN).toBe('wallet_addEthereumChain');
      expect(RPC_METHODS.WALLET_SWITCHETHEREUMCHAIN).toBe(
        'wallet_switchEthereumChain',
      );
      expect(RPC_METHODS.METAMASK_BATCH).toBe('metamask_batch');
    });
  });

  describe('METHODS_TO_REDIRECT', () => {
    it('marks transaction / sign / permission methods as redirected', () => {
      expect(METHODS_TO_REDIRECT[RPC_METHODS.ETH_SENDTRANSACTION]).toBe(true);
      expect(METHODS_TO_REDIRECT[RPC_METHODS.PERSONAL_SIGN]).toBe(true);
      expect(METHODS_TO_REDIRECT[RPC_METHODS.WALLET_ADDETHEREUMCHAIN]).toBe(true);
      expect(METHODS_TO_REDIRECT[RPC_METHODS.METAMASK_BATCH]).toBe(true);
    });

    it('does not include read-only methods', () => {
      expect(METHODS_TO_REDIRECT[RPC_METHODS.ETH_ACCOUNTS]).toBeUndefined();
      expect(METHODS_TO_REDIRECT[RPC_METHODS.ETH_CHAINID]).toBeUndefined();
    });
  });

  describe('METHODS_TO_DELAY', () => {
    it('inherits from METHODS_TO_REDIRECT but disables eth_requestAccounts', () => {
      expect(METHODS_TO_DELAY[RPC_METHODS.ETH_REQUESTACCOUNTS]).toBe(false);
      expect(METHODS_TO_DELAY[RPC_METHODS.ETH_SENDTRANSACTION]).toBe(true);
      expect(METHODS_TO_DELAY[RPC_METHODS.PERSONAL_SIGN]).toBe(true);
    });
  });
});
