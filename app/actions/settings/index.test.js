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
} from './';

describe('Settings Actions', () => {
  describe('setSearchEngine', () => {
    it('returns SET_SEARCH_ENGINE action', () => {
      expect(setSearchEngine('Google')).toEqual({
        type: 'SET_SEARCH_ENGINE',
        searchEngine: 'Google',
      });
    });
  });

  describe('setShowHexData', () => {
    it('returns SET_SHOW_HEX_DATA action', () => {
      expect(setShowHexData(true)).toEqual({
        type: 'SET_SHOW_HEX_DATA',
        showHexData: true,
      });
    });
  });

  describe('setShowCustomNonce', () => {
    it('returns SET_SHOW_CUSTOM_NONCE action', () => {
      expect(setShowCustomNonce(true)).toEqual({
        type: 'SET_SHOW_CUSTOM_NONCE',
        showCustomNonce: true,
      });
    });
  });

  describe('setShowFiatOnTestnets', () => {
    it('returns SET_SHOW_FIAT_ON_TESTNETS action', () => {
      expect(setShowFiatOnTestnets(true)).toEqual({
        type: 'SET_SHOW_FIAT_ON_TESTNETS',
        showFiatOnTestnets: true,
      });
    });
  });

  describe('setHideZeroBalanceTokens', () => {
    it('returns SET_HIDE_ZERO_BALANCE_TOKENS action', () => {
      expect(setHideZeroBalanceTokens(true)).toEqual({
        type: 'SET_HIDE_ZERO_BALANCE_TOKENS',
        hideZeroBalanceTokens: true,
      });
    });
  });

  describe('setLockTime', () => {
    it('returns SET_LOCK_TIME action', () => {
      expect(setLockTime(30000)).toEqual({
        type: 'SET_LOCK_TIME',
        lockTime: 30000,
      });
    });
  });

  describe('setPrimaryCurrency', () => {
    it('returns SET_PRIMARY_CURRENCY action', () => {
      expect(setPrimaryCurrency('Fiat')).toEqual({
        type: 'SET_PRIMARY_CURRENCY',
        primaryCurrency: 'Fiat',
      });
    });
  });

  describe('setUseBlockieIcon', () => {
    it('returns SET_USE_BLOCKIE_ICON action', () => {
      expect(setUseBlockieIcon(false)).toEqual({
        type: 'SET_USE_BLOCKIE_ICON',
        useBlockieIcon: false,
      });
    });
  });

  describe('toggleBasicFunctionality', () => {
    it('returns TOGGLE_BASIC_FUNCTIONALITY action', () => {
      expect(toggleBasicFunctionality(false)).toEqual({
        type: 'TOGGLE_BASIC_FUNCTIONALITY',
        basicFunctionalityEnabled: false,
      });
    });
  });

  describe('toggleDeviceNotification', () => {
    it('returns TOGGLE_DEVICE_NOTIFICATIONS action', () => {
      expect(toggleDeviceNotification(true)).toEqual({
        type: 'TOGGLE_DEVICE_NOTIFICATIONS',
        deviceNotificationEnabled: true,
      });
    });
  });

  describe('setTokenSortConfig', () => {
    it('returns SET_TOKEN_SORT_CONFIG action', () => {
      const config = { key: 'tokenFiatAmount', order: 'dsc' };
      expect(setTokenSortConfig(config)).toEqual({
        type: 'SET_TOKEN_SORT_CONFIG',
        tokenSortConfig: config,
      });
    });
  });
});
