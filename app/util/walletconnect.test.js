import { CLIENT_OPTIONS, WALLET_CONNECT_ORIGIN } from './walletconnect';

describe('walletconnect', () => {
  it('should export CLIENT_OPTIONS with clientMeta', () => {
    expect(CLIENT_OPTIONS).toHaveProperty('clientMeta');
    expect(CLIENT_OPTIONS.clientMeta.name).toBe('MetaMask');
    expect(CLIENT_OPTIONS.clientMeta.url).toBe('https://metamask.io');
    expect(CLIENT_OPTIONS.clientMeta.description).toBe('MetaMask Mobile app');
    expect(CLIENT_OPTIONS.clientMeta.ssl).toBe(true);
  });

  it('should export WALLET_CONNECT_ORIGIN', () => {
    expect(WALLET_CONNECT_ORIGIN).toBe('wc::');
  });
});
