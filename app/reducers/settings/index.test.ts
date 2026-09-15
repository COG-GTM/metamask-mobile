import settingsReducer from './index';

describe('settingsReducer', () => {
  const emptyAction = { type: null };

  it('returns initial state', () => {
    const state = settingsReducer(undefined, emptyAction);
    expect(state).toEqual({
      searchEngine: expect.any(String),
      primaryCurrency: 'ETH',
      lockTime: -1,
      useBlockieIcon: true,
      hideZeroBalanceTokens: false,
      basicFunctionalityEnabled: true,
    });
  });

  describe('TOGGLE_DEVICE_NOTIFICATIONS', () => {
    it('updates deviceNotificationEnabled when the value changes', () => {
      const initialState = settingsReducer(undefined, emptyAction);

      const enabledState = settingsReducer(initialState, {
        type: 'TOGGLE_DEVICE_NOTIFICATIONS',
        deviceNotificationEnabled: true,
      });
      expect(enabledState).not.toBe(initialState);
      expect(enabledState).toMatchObject({ deviceNotificationEnabled: true });

      const disabledState = settingsReducer(enabledState, {
        type: 'TOGGLE_DEVICE_NOTIFICATIONS',
        deviceNotificationEnabled: false,
      });
      expect(disabledState).not.toBe(enabledState);
      expect(disabledState).toMatchObject({
        deviceNotificationEnabled: false,
      });
    });

    it('returns the same state reference when the value is unchanged', () => {
      const enabledState = settingsReducer(undefined, {
        type: 'TOGGLE_DEVICE_NOTIFICATIONS',
        deviceNotificationEnabled: true,
      });

      const nextState = settingsReducer(enabledState, {
        type: 'TOGGLE_DEVICE_NOTIFICATIONS',
        deviceNotificationEnabled: true,
      });

      expect(nextState).toBe(enabledState);
    });
  });
});
