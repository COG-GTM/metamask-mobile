import reducer, {
  initialState,
  setCategoryEnabled,
  setMinimumPriority,
  setQuietHours,
  toggleQuietHours,
  resetPreferences,
} from './index';
import {
  NotificationCategory,
  NotificationPriority,
} from '../../../../util/notifications/types/notification-types';

describe('notificationPreferences slice', () => {
  it('returns the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setCategoryEnabled', () => {
    it('enables a category', () => {
      const state = reducer(
        initialState,
        setCategoryEnabled({
          category: NotificationCategory.SECURITY,
          enabled: true,
        }),
      );
      expect(state.categoryEnabled[NotificationCategory.SECURITY]).toBe(true);
    });

    it('disables a category', () => {
      const state = reducer(
        initialState,
        setCategoryEnabled({
          category: NotificationCategory.PRICE_ALERT,
          enabled: false,
        }),
      );
      expect(state.categoryEnabled[NotificationCategory.PRICE_ALERT]).toBe(
        false,
      );
    });
  });

  describe('setMinimumPriority', () => {
    it('updates the minimum priority', () => {
      const state = reducer(
        initialState,
        setMinimumPriority(NotificationPriority.HIGH),
      );
      expect(state.minimumPriority).toBe(NotificationPriority.HIGH);
    });
  });

  describe('setQuietHours', () => {
    it('replaces quiet hours config', () => {
      const newConfig = { enabled: true, startHour: 20, endHour: 6 };
      const state = reducer(initialState, setQuietHours(newConfig));
      expect(state.quietHours).toEqual(newConfig);
    });
  });

  describe('toggleQuietHours', () => {
    it('toggles quiet hours on', () => {
      const state = reducer(initialState, toggleQuietHours(true));
      expect(state.quietHours.enabled).toBe(true);
      // time window should remain unchanged
      expect(state.quietHours.startHour).toBe(initialState.quietHours.startHour);
      expect(state.quietHours.endHour).toBe(initialState.quietHours.endHour);
    });

    it('toggles quiet hours off', () => {
      const enabledState = reducer(initialState, toggleQuietHours(true));
      const state = reducer(enabledState, toggleQuietHours(false));
      expect(state.quietHours.enabled).toBe(false);
    });
  });

  describe('resetPreferences', () => {
    it('restores default state', () => {
      let state = reducer(
        initialState,
        setCategoryEnabled({
          category: NotificationCategory.DAPP,
          enabled: false,
        }),
      );
      state = reducer(state, setMinimumPriority(NotificationPriority.CRITICAL));
      state = reducer(state, resetPreferences());
      expect(state).toEqual(initialState);
    });
  });
});
