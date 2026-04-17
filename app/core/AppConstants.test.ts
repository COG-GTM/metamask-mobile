import AppConstants from './AppConstants';

describe('AppConstants', () => {
  it('has DEFAULT_LOCK_TIMEOUT', () => {
    expect(AppConstants.DEFAULT_LOCK_TIMEOUT).toBe(30000);
  });

  it('has DEFAULT_SEARCH_ENGINE', () => {
    expect(AppConstants.DEFAULT_SEARCH_ENGINE).toBe('Google');
  });

  it('has supportedTLDs', () => {
    expect(AppConstants.supportedTLDs).toEqual(['eth', 'xyz', 'test']);
  });

  it('has IPFS_DEFAULT_GATEWAY_URL', () => {
    expect(AppConstants.IPFS_DEFAULT_GATEWAY_URL).toBe('https://dweb.link/ipfs/');
  });

  it('has ZERO_ADDRESS', () => {
    expect(AppConstants.ZERO_ADDRESS).toBe('0x0000000000000000000000000000000000000000');
  });

  it('has NOTIFICATION_NAMES', () => {
    expect(AppConstants.NOTIFICATION_NAMES).toEqual({
      accountsChanged: 'metamask_accountsChanged',
      unlockStateChanged: 'metamask_unlockStateChanged',
      chainChanged: 'metamask_chainChanged',
    });
  });

  it('has DEEPLINKS', () => {
    expect(AppConstants.DEEPLINKS.ORIGIN_DEEPLINK).toBe('deeplink');
    expect(AppConstants.DEEPLINKS.ORIGIN_QR_CODE).toBe('qr-code');
    expect(AppConstants.DEEPLINKS.ORIGIN_NOTIFICATION).toBe('notifications');
  });

  it('has WALLET_CONNECT config', () => {
    expect(AppConstants.WALLET_CONNECT.SESSION_LIFETIME).toBe(24);
    expect(AppConstants.WALLET_CONNECT.LIMIT_SESSIONS).toBe(20);
    expect(AppConstants.WALLET_CONNECT.METADATA.name).toBe('MetaMask Wallet');
  });

  it('has SWAPS config', () => {
    expect(AppConstants.SWAPS.ACTIVE).toBe(true);
    expect(AppConstants.SWAPS.CLIENT_ID).toBe('mobile');
    expect(AppConstants.SWAPS.DEFAULT_SLIPPAGE).toBe(2);
  });

  it('has GAS_OPTIONS', () => {
    expect(AppConstants.GAS_OPTIONS).toEqual({
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      MARKET: 'market',
      AGGRESSIVE: 'aggressive',
    });
  });

  it('has GAS_TIMES', () => {
    expect(AppConstants.GAS_TIMES).toEqual({
      UNKNOWN: 'unknown',
      MAYBE: 'maybe',
      LIKELY: 'likely',
      VERY_LIKELY: 'very_likely',
      AT_LEAST: 'at_least',
      LESS_THAN: 'less_than',
      RANGE: 'range',
    });
  });

  it('has BUNDLE_IDS', () => {
    expect(AppConstants.BUNDLE_IDS.IOS).toBe('io.metamask.MetaMask');
    expect(AppConstants.BUNDLE_IDS.ANDROID).toBe('io.metamask');
  });

  it('has FIAT_ORDERS', () => {
    expect(AppConstants.FIAT_ORDERS.POLLING_FREQUENCY).toBe(10000);
  });

  it('has MM_SDK config', () => {
    expect(AppConstants.MM_SDK.PLATFORM).toBe('metamask-mobile');
    expect(AppConstants.MM_SDK.SDK_REMOTE_ORIGIN).toBe('MMSDKREMOTE::');
  });

  it('has REQUEST_SOURCES', () => {
    expect(AppConstants.REQUEST_SOURCES.WC).toBe('WalletConnect');
    expect(AppConstants.REQUEST_SOURCES.IN_APP_BROWSER).toBe('In-App-Browser');
  });

  it('has PORTFOLIO URL', () => {
    expect(AppConstants.PORTFOLIO.URL).toContain('portfolio.metamask.io');
  });

  it('has BRIDGE config', () => {
    expect(AppConstants.BRIDGE.ACTIVE).toBe(true);
    expect(AppConstants.BRIDGE.URL).toContain('bridge');
  });

  it('has URLS', () => {
    expect(AppConstants.URLS.TERMS_AND_CONDITIONS).toContain('terms-of-use');
    expect(AppConstants.URLS.PRIVACY_POLICY).toContain('privacy-policy');
  });

  it('has ERRORS', () => {
    expect(AppConstants.ERRORS.INFURA_BLOCKED_MESSAGE).toContain('not available');
  });

  it('has CONNEXT config', () => {
    expect(AppConstants.CONNEXT.MIN_DEPOSIT_ETH).toBe(0.03);
  });

  it('has MAX_SAFE_CHAIN_ID', () => {
    expect(AppConstants.MAX_SAFE_CHAIN_ID).toBe(4503599627370476);
  });

  it('has BASIC_FUNCTIONALITY_BLOCK_LIST', () => {
    expect(AppConstants.BASIC_FUNCTIONALITY_BLOCK_LIST).toContain('infura.io');
  });

  it('has FEATURE_FLAGS_API', () => {
    expect(AppConstants.FEATURE_FLAGS_API.BASE_URL).toContain('metamask.io');
    expect(AppConstants.FEATURE_FLAGS_API.VERSION).toBe('v1');
  });

  it('has TERMS_OF_USE', () => {
    expect(AppConstants.TERMS_OF_USE.TERMS_DISPLAYED).toBe('ToU Displayed');
    expect(AppConstants.TERMS_OF_USE.TERMS_ACCEPTED).toBe('ToU Accepted');
  });

  it('has FAVICON_CACHE_MAX_SIZE', () => {
    expect(AppConstants.FAVICON_CACHE_MAX_SIZE).toBe(100);
  });
});
