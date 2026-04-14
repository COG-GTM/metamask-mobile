import { METHODS_TO_REDIRECT } from './wc-config';

describe('wc-config', () => {
  it('should export METHODS_TO_REDIRECT object', () => {
    expect(typeof METHODS_TO_REDIRECT).toBe('object');
  });

  it('should include eth_requestAccounts', () => {
    expect(METHODS_TO_REDIRECT.eth_requestAccounts).toBe(true);
  });

  it('should include eth_sendTransaction', () => {
    expect(METHODS_TO_REDIRECT.eth_sendTransaction).toBe(true);
  });

  it('should include personal_sign', () => {
    expect(METHODS_TO_REDIRECT.personal_sign).toBe(true);
  });

  it('should include wallet_switchEthereumChain', () => {
    expect(METHODS_TO_REDIRECT.wallet_switchEthereumChain).toBe(true);
  });

  it('should include all typed data signing methods', () => {
    expect(METHODS_TO_REDIRECT.eth_signTypedData).toBe(true);
    expect(METHODS_TO_REDIRECT.eth_signTypedData_v3).toBe(true);
    expect(METHODS_TO_REDIRECT.eth_signTypedData_v4).toBe(true);
  });
});
