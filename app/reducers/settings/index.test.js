import settingsReducer from './index';

jest.mock('../../core/AppConstants', () => ({
  DEFAULT_SEARCH_ENGINE: 'DuckDuckGo',
}));

const initialState = {
  searchEngine: 'DuckDuckGo',
  primaryCurrency: 'ETH',
  lockTime: -1,
  useBlockieIcon: true,
  hideZeroBalanceTokens: false,
  basicFunctionalityEnabled: true,
};

describe('settingsReducer', () => {
  it('should return initial state', () => {
    const state = settingsReducer(undefined, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });

  it('should handle SET_SEARCH_ENGINE', () => {
    const state = settingsReducer(initialState, {
      type: 'SET_SEARCH_ENGINE',
      searchEngine: 'Google',
    });
    expect(state.searchEngine).toBe('Google');
  });

  it('should handle SET_LOCK_TIME', () => {
    const state = settingsReducer(initialState, {
      type: 'SET_LOCK_TIME',
      lockTime: 30000,
    });
    expect(state.lockTime).toBe(30000);
  });

  it('should handle SET_SHOW_HEX_DATA', () => {
    const state = settingsReducer(initialState, {
      type: 'SET_SHOW_HEX_DATA',
      showHexData: true,
    });
    expect(state.showHexData).toBe(true);
  });

  it('should handle SET_SHOW_CUSTOM_NONCE', () => {
    const state = settingsReducer(initialState, {
      type: 'SET_SHOW_CUSTOM_NONCE',
      showCustomNonce: true,
    });
    expect(state.showCustomNonce).toBe(true);
  });

  it('should handle SET_HIDE_ZERO_BALANCE_TOKENS', () => {
    const state = settingsReducer(initialState, {
      type: 'SET_HIDE_ZERO_BALANCE_TOKENS',
      hideZeroBalanceTokens: true,
    });
    expect(state.hideZeroBalanceTokens).toBe(true);
  });

  it('should handle SET_USE_BLOCKIE_ICON', () => {
    const state = settingsReducer(initialState, {
      type: 'SET_USE_BLOCKIE_ICON',
      useBlockieIcon: false,
    });
    expect(state.useBlockieIcon).toBe(false);
  });

  it('should handle SET_PRIMARY_CURRENCY', () => {
    const state = settingsReducer(initialState, {
      type: 'SET_PRIMARY_CURRENCY',
      primaryCurrency: 'Fiat',
    });
    expect(state.primaryCurrency).toBe('Fiat');
  });

  it('should handle SET_SHOW_FIAT_ON_TESTNETS', () => {
    const state = settingsReducer(initialState, {
      type: 'SET_SHOW_FIAT_ON_TESTNETS',
      showFiatOnTestnets: true,
    });
    expect(state.showFiatOnTestnets).toBe(true);
  });

  it('should handle TOGGLE_BASIC_FUNCTIONALITY', () => {
    const state = settingsReducer(initialState, {
      type: 'TOGGLE_BASIC_FUNCTIONALITY',
      basicFunctionalityEnabled: false,
    });
    expect(state.basicFunctionalityEnabled).toBe(false);
  });

  it('should handle TOGGLE_DEVICE_NOTIFICATIONS', () => {
    const state = settingsReducer(initialState, {
      type: 'TOGGLE_DEVICE_NOTIFICATIONS',
      deviceNotificationEnabled: true,
    });
    expect(state.deviceNotificationEnabled).toBe(true);
  });

  it('should return current state for unknown action', () => {
    const state = settingsReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toBe(initialState);
  });
});
