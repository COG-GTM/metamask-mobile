import settingsReducer from '.';

describe('Settings Reducer', () => {
  it('should return initial state', () => {
    const state = settingsReducer(undefined, {});

    expect(state).toHaveProperty('searchEngine');
    expect(state).toHaveProperty('lockTime');
    expect(state).toHaveProperty('primaryCurrency');
  });

  it('should handle SET_SEARCH_ENGINE', () => {
    const state = settingsReducer(undefined, {});
    const result = settingsReducer(state, {
      type: 'SET_SEARCH_ENGINE',
      searchEngine: 'DuckDuckGo',
    });

    expect(result.searchEngine).toBe('DuckDuckGo');
  });

  it('should handle SET_SHOW_HEX_DATA', () => {
    const state = settingsReducer(undefined, {});
    const result = settingsReducer(state, {
      type: 'SET_SHOW_HEX_DATA',
      showHexData: true,
    });

    expect(result.showHexData).toBe(true);
  });

  it('should handle SET_SHOW_CUSTOM_NONCE', () => {
    const state = settingsReducer(undefined, {});
    const result = settingsReducer(state, {
      type: 'SET_SHOW_CUSTOM_NONCE',
      showCustomNonce: true,
    });

    expect(result.showCustomNonce).toBe(true);
  });

  it('should handle SET_HIDE_ZERO_BALANCE_TOKENS', () => {
    const state = settingsReducer(undefined, {});
    const result = settingsReducer(state, {
      type: 'SET_HIDE_ZERO_BALANCE_TOKENS',
      hideZeroBalanceTokens: true,
    });

    expect(result.hideZeroBalanceTokens).toBe(true);
  });

  it('should handle SET_LOCK_TIME', () => {
    const state = settingsReducer(undefined, {});
    const result = settingsReducer(state, {
      type: 'SET_LOCK_TIME',
      lockTime: 60000,
    });

    expect(result.lockTime).toBe(60000);
  });

  it('should handle SET_PRIMARY_CURRENCY', () => {
    const state = settingsReducer(undefined, {});
    const result = settingsReducer(state, {
      type: 'SET_PRIMARY_CURRENCY',
      primaryCurrency: 'ETH',
    });

    expect(result.primaryCurrency).toBe('ETH');
  });

  it('should handle SET_USE_BLOCKIE_ICON', () => {
    const state = settingsReducer(undefined, {});
    const result = settingsReducer(state, {
      type: 'SET_USE_BLOCKIE_ICON',
      useBlockieIcon: true,
    });

    expect(result.useBlockieIcon).toBe(true);
  });

  it('should handle TOGGLE_BASIC_FUNCTIONALITY', () => {
    const state = settingsReducer(undefined, {});
    const result = settingsReducer(state, {
      type: 'TOGGLE_BASIC_FUNCTIONALITY',
      basicFunctionalityEnabled: false,
    });

    expect(result.basicFunctionalityEnabled).toBe(false);
  });

  it('should handle TOGGLE_DEVICE_NOTIFICATIONS', () => {
    const state = settingsReducer(undefined, {});
    const result = settingsReducer(state, {
      type: 'TOGGLE_DEVICE_NOTIFICATIONS',
      deviceNotificationEnabled: true,
    });

    expect(result.deviceNotificationEnabled).toBe(true);
  });

  it('should handle SET_TOKEN_SORT_CONFIG', () => {
    const state = settingsReducer(undefined, {});
    const config = { key: 'tokenFiatAmount', order: 'dsc' };
    const result = settingsReducer(state, {
      type: 'SET_TOKEN_SORT_CONFIG',
      tokenSortConfig: config,
    });

    expect(result.tokenSortConfig).toStrictEqual(config);
  });

  it('should return state for unknown action', () => {
    const state = settingsReducer(undefined, {});

    expect(settingsReducer(state, { type: 'UNKNOWN' })).toStrictEqual(state);
  });
});
