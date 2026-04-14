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
} from '.';

describe('Settings Actions', () => {
  it('setSearchEngine should return correct action', () => {
    expect(setSearchEngine('DuckDuckGo')).toStrictEqual({
      type: 'SET_SEARCH_ENGINE',
      searchEngine: 'DuckDuckGo',
    });
  });

  it('setShowHexData should return correct action', () => {
    expect(setShowHexData(true)).toStrictEqual({
      type: 'SET_SHOW_HEX_DATA',
      showHexData: true,
    });
  });

  it('setShowCustomNonce should return correct action', () => {
    expect(setShowCustomNonce(true)).toStrictEqual({
      type: 'SET_SHOW_CUSTOM_NONCE',
      showCustomNonce: true,
    });
  });

  it('setShowFiatOnTestnets should return correct action', () => {
    expect(setShowFiatOnTestnets(false)).toStrictEqual({
      type: 'SET_SHOW_FIAT_ON_TESTNETS',
      showFiatOnTestnets: false,
    });
  });

  it('setHideZeroBalanceTokens should return correct action', () => {
    expect(setHideZeroBalanceTokens(true)).toStrictEqual({
      type: 'SET_HIDE_ZERO_BALANCE_TOKENS',
      hideZeroBalanceTokens: true,
    });
  });

  it('setLockTime should return correct action', () => {
    expect(setLockTime(30000)).toStrictEqual({
      type: 'SET_LOCK_TIME',
      lockTime: 30000,
    });
  });

  it('setPrimaryCurrency should return correct action', () => {
    expect(setPrimaryCurrency('ETH')).toStrictEqual({
      type: 'SET_PRIMARY_CURRENCY',
      primaryCurrency: 'ETH',
    });
  });

  it('setUseBlockieIcon should return correct action', () => {
    expect(setUseBlockieIcon(true)).toStrictEqual({
      type: 'SET_USE_BLOCKIE_ICON',
      useBlockieIcon: true,
    });
  });

  it('toggleBasicFunctionality should return correct action', () => {
    expect(toggleBasicFunctionality(false)).toStrictEqual({
      type: 'TOGGLE_BASIC_FUNCTIONALITY',
      basicFunctionalityEnabled: false,
    });
  });

  it('toggleDeviceNotification should return correct action', () => {
    expect(toggleDeviceNotification(true)).toStrictEqual({
      type: 'TOGGLE_DEVICE_NOTIFICATIONS',
      deviceNotificationEnabled: true,
    });
  });

  it('setTokenSortConfig should return correct action', () => {
    const config = { key: 'tokenFiatAmount', order: 'dsc' };

    expect(setTokenSortConfig(config)).toStrictEqual({
      type: 'SET_TOKEN_SORT_CONFIG',
      tokenSortConfig: config,
    });
  });
});
