import METHODS_TO_REDIRECT, { METHODS_TO_REDIRECT as NAMED } from './wc-config';

describe('WalletConnect wc-config', () => {
  it('marks EVM transaction and signature methods as redirected', () => {
    expect(METHODS_TO_REDIRECT.eth_requestAccounts).toBe(true);
    expect(METHODS_TO_REDIRECT.eth_sendTransaction).toBe(true);
    expect(METHODS_TO_REDIRECT.eth_signTransaction).toBe(true);
    expect(METHODS_TO_REDIRECT.personal_sign).toBe(true);
    expect(METHODS_TO_REDIRECT.eth_signTypedData).toBe(true);
    expect(METHODS_TO_REDIRECT.eth_signTypedData_v3).toBe(true);
    expect(METHODS_TO_REDIRECT.eth_signTypedData_v4).toBe(true);
  });

  it('marks wallet chain/asset methods as redirected', () => {
    expect(METHODS_TO_REDIRECT.wallet_watchAsset).toBe(true);
    expect(METHODS_TO_REDIRECT.wallet_addEthereumChain).toBe(true);
    expect(METHODS_TO_REDIRECT.wallet_switchEthereumChain).toBe(true);
  });

  it('does not mark read-only methods as redirected', () => {
    expect(METHODS_TO_REDIRECT.eth_accounts).toBeUndefined();
    expect(METHODS_TO_REDIRECT.eth_chainId).toBeUndefined();
  });

  it('exports the same object as default and named export', () => {
    expect(NAMED).toBe(METHODS_TO_REDIRECT);
  });
});
