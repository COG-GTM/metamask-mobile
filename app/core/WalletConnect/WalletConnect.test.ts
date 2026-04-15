describe('WalletConnect v1 (deprecated)', () => {
  it('should export a stub with deprecation warnings', () => {
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;
    expect(WalletConnect).toBeDefined();
    expect(WalletConnect.connectors()).toEqual([]);
    expect(WalletConnect.isValidUri('test')).toBe(false);
    expect(WalletConnect.isSessionConnected('test')).toBe(false);
  });

  it('should return empty sessions', async () => {
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;
    const sessions = await WalletConnect.getSessions();
    expect(sessions).toEqual([]);
  });

  it('should have a hub event emitter', () => {
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;
    expect(WalletConnect.hub).toBeDefined();
    expect(typeof WalletConnect.hub.on).toBe('function');
  });
});
