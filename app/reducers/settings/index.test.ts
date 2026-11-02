import settingsReducer from '.';

describe('settingsReducer - TOGGLE_DEVICE_NOTIFICATIONS', () => {
  it('returns the same state object when the flag is unchanged', () => {
    const state = settingsReducer(undefined, {
      type: 'TOGGLE_DEVICE_NOTIFICATIONS',
      deviceNotificationEnabled: true,
    });

    const next = settingsReducer(state, {
      type: 'TOGGLE_DEVICE_NOTIFICATIONS',
      deviceNotificationEnabled: true,
    });

    expect(next).toBe(state);
  });

  it('returns a new state object when the flag changes', () => {
    const state = settingsReducer(undefined, {
      type: 'TOGGLE_DEVICE_NOTIFICATIONS',
      deviceNotificationEnabled: true,
    });

    const next = settingsReducer(state, {
      type: 'TOGGLE_DEVICE_NOTIFICATIONS',
      deviceNotificationEnabled: false,
    });

    expect(next).not.toBe(state);
    expect(next).toEqual(
      expect.objectContaining({ deviceNotificationEnabled: false }),
    );
  });
});
