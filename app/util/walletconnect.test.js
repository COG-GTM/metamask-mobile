import { CLIENT_OPTIONS, WALLET_CONNECT_ORIGIN } from './walletconnect';

describe('walletconnect constants', () => {
  it('CLIENT_OPTIONS exposes a clientMeta object identifying MetaMask Mobile', () => {
    expect(CLIENT_OPTIONS).toEqual({
      clientMeta: {
        description: 'MetaMask Mobile app',
        url: 'https://metamask.io',
        icons: [],
        name: 'MetaMask',
        ssl: true,
      },
    });
  });

  it('WALLET_CONNECT_ORIGIN is the wc:: string prefix', () => {
    expect(WALLET_CONNECT_ORIGIN).toBe('wc::');
  });
});
