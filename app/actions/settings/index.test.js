import {
  setSearchEngine,
  setShowHexData,
  setShowCustomNonce,
  setShowFiatOnTestnets,
  setHideZeroBalanceTokens,
  setLockTime,
  setPrimaryCurrency,
  setUseBlockieIcon,
  toggleBasicFunctionality,
  toggleDeviceNotification,
  setTokenSortConfig,
} from './index';

describe('settings actions', () => {
  it('setSearchEngine', () => {
    expect(setSearchEngine('DuckDuckGo')).toEqual({ type: 'SET_SEARCH_ENGINE', searchEngine: 'DuckDuckGo' });
  });

  it('setShowHexData', () => {
    expect(setShowHexData(true)).toEqual({ type: 'SET_SHOW_HEX_DATA', showHexData: true });
  });

  it('setShowCustomNonce', () => {
    expect(setShowCustomNonce(true)).toEqual({ type: 'SET_SHOW_CUSTOM_NONCE', showCustomNonce: true });
  });

  it('setShowFiatOnTestnets', () => {
    expect(setShowFiatOnTestnets(true)).toEqual({ type: 'SET_SHOW_FIAT_ON_TESTNETS', showFiatOnTestnets: true });
  });

  it('setHideZeroBalanceTokens', () => {
    expect(setHideZeroBalanceTokens(true)).toEqual({ type: 'SET_HIDE_ZERO_BALANCE_TOKENS', hideZeroBalanceTokens: true });
  });

  it('setLockTime', () => {
    expect(setLockTime(60000)).toEqual({ type: 'SET_LOCK_TIME', lockTime: 60000 });
  });

  it('setPrimaryCurrency', () => {
    expect(setPrimaryCurrency('ETH')).toEqual({ type: 'SET_PRIMARY_CURRENCY', primaryCurrency: 'ETH' });
  });

  it('setUseBlockieIcon', () => {
    expect(setUseBlockieIcon(true)).toEqual({ type: 'SET_USE_BLOCKIE_ICON', useBlockieIcon: true });
  });

  it('toggleBasicFunctionality', () => {
    expect(toggleBasicFunctionality(false)).toEqual({ type: 'TOGGLE_BASIC_FUNCTIONALITY', basicFunctionalityEnabled: false });
  });

  it('toggleDeviceNotification', () => {
    expect(toggleDeviceNotification(true)).toEqual({ type: 'TOGGLE_DEVICE_NOTIFICATIONS', deviceNotificationEnabled: true });
  });

  it('setTokenSortConfig', () => {
    const config = { key: 'tokenFiatAmount', order: 'dsc', sortCallback: 'stringNumeric' };
    expect(setTokenSortConfig(config)).toEqual({ type: 'SET_TOKEN_SORT_CONFIG', tokenSortConfig: config });
  });
});
