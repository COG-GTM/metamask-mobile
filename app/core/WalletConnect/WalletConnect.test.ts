/**
 * @deprecated WalletConnect v1 has been removed. All WalletConnect sessions now use v2 only.
 * These tests verify the v1 stub module behaves correctly.
 */

describe('WalletConnect (v1 stub)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should export a stub instance with expected methods', () => {
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;

    expect(WalletConnect).toBeDefined();
    expect(typeof WalletConnect.init).toBe('function');
    expect(typeof WalletConnect.connectors).toBe('function');
    expect(typeof WalletConnect.newSession).toBe('function');
    expect(typeof WalletConnect.getSessions).toBe('function');
    expect(typeof WalletConnect.killSession).toBe('function');
    expect(typeof WalletConnect.isValidUri).toBe('function');
    expect(typeof WalletConnect.isSessionConnected).toBe('function');
  });

  it('should return empty connectors', () => {
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;
    expect(WalletConnect.connectors()).toEqual([]);
  });

  it('should return empty sessions', async () => {
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;
    const sessions = await WalletConnect.getSessions();
    expect(sessions).toEqual([]);
  });

  it('should always return false for isValidUri', () => {
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;
    expect(WalletConnect.isValidUri('wc:test')).toBe(false);
  });

  it('should always return false for isSessionConnected', () => {
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;
    expect(WalletConnect.isSessionConnected('test')).toBe(false);
  });
});
