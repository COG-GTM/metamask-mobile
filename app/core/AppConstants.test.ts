import AppConstants from './AppConstants';

describe('AppConstants', () => {
  it('should define DEFAULT_LOCK_TIMEOUT', () => {
    expect(AppConstants.DEFAULT_LOCK_TIMEOUT).toBe(30000);
  });

  it('should define DEFAULT_SEARCH_ENGINE', () => {
    expect(AppConstants.DEFAULT_SEARCH_ENGINE).toBe('Google');
  });

  it('should define ZERO_ADDRESS', () => {
    expect(AppConstants.ZERO_ADDRESS).toBe('0x0000000000000000000000000000000000000000');
  });

  it('should define NOTIFICATION_NAMES', () => {
    expect(AppConstants.NOTIFICATION_NAMES.accountsChanged).toBe('metamask_accountsChanged');
    expect(AppConstants.NOTIFICATION_NAMES.unlockStateChanged).toBe('metamask_unlockStateChanged');
    expect(AppConstants.NOTIFICATION_NAMES.chainChanged).toBe('metamask_chainChanged');
  });

  it('should define DEEPLINKS', () => {
    expect(AppConstants.DEEPLINKS.ORIGIN_DEEPLINK).toBe('deeplink');
    expect(AppConstants.DEEPLINKS.ORIGIN_QR_CODE).toBe('qr-code');
  });

  it('should define GAS_OPTIONS', () => {
    expect(AppConstants.GAS_OPTIONS.LOW).toBe('low');
    expect(AppConstants.GAS_OPTIONS.HIGH).toBe('high');
  });

  it('should define WALLET_CONNECT', () => {
    expect(AppConstants.WALLET_CONNECT.SESSION_LIFETIME).toBe(24);
    expect(AppConstants.WALLET_CONNECT.LIMIT_SESSIONS).toBe(20);
  });

  it('should define SWAPS', () => {
    expect(AppConstants.SWAPS.ACTIVE).toBe(true);
    expect(AppConstants.SWAPS.CLIENT_ID).toBe('mobile');
  });

  it('should define BUNDLE_IDS', () => {
    expect(AppConstants.BUNDLE_IDS.IOS).toBe('io.metamask.MetaMask');
    expect(AppConstants.BUNDLE_IDS.ANDROID).toBe('io.metamask');
  });

  it('should define URLS', () => {
    expect(AppConstants.URLS.TERMS_AND_CONDITIONS).toContain('consensys');
    expect(AppConstants.URLS.PRIVACY_POLICY).toContain('consensys');
  });

  it('should define supportedTLDs', () => {
    expect(AppConstants.supportedTLDs).toContain('eth');
    expect(AppConstants.supportedTLDs).toContain('xyz');
  });

  it('should define MAX_SAFE_CHAIN_ID', () => {
    expect(AppConstants.MAX_SAFE_CHAIN_ID).toBe(4503599627370476);
  });

  it('should define BRIDGE', () => {
    expect(AppConstants.BRIDGE.ACTIVE).toBe(true);
    expect(AppConstants.BRIDGE.URL).toContain('bridge');
  });

  it('should define REQUEST_SOURCES', () => {
    expect(AppConstants.REQUEST_SOURCES.WC).toBe('WalletConnect');
    expect(AppConstants.REQUEST_SOURCES.WC2).toBe('WalletConnectV2');
  });
});
