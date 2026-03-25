import reducer, {
  initialState,
  toggleCategory,
  setQuietHours,
  setGroupingEnabled,
  setPriorityThreshold,
  NotificationPreferencesState,
} from './index';
import {
  NotificationCategory,
  NotificationPriority,
} from '../../../../util/notifications/types/notification-types';

describe('notificationPreferences slice', () => {
  it('returns the initial state', () => {
    const state = reducer(undefined, { type: 'unknown' });
    expect(state).toEqual(initialState);
  });

  describe('toggleCategory', () => {
    it('disables a specific category', () => {
      const state = reducer(
        initialState,
        toggleCategory({
          category: NotificationCategory.PRICE_ALERT,
          enabled: false,
        }),
      );

      expect(state.categoryToggles[NotificationCategory.PRICE_ALERT]).toBe(
        false,
      );
      // Other categories remain unchanged
      expect(state.categoryToggles[NotificationCategory.TRANSACTION]).toBe(
        true,
      );
    });

    it('re-enables a previously disabled category', () => {
      const disabledState: NotificationPreferencesState = {
        ...initialState,
        categoryToggles: {
          ...initialState.categoryToggles,
          [NotificationCategory.DAPP]: false,
        },
      };

      const state = reducer(
        disabledState,
        toggleCategory({
          category: NotificationCategory.DAPP,
          enabled: true,
        }),
      );

      expect(state.categoryToggles[NotificationCategory.DAPP]).toBe(true);
    });
  });

  describe('setQuietHours', () => {
    it('updates quiet hours configuration', () => {
      const newQuietHours = {
        enabled: true,
        startTime: '23:00',
        endTime: '06:00',
      };

      const state = reducer(initialState, setQuietHours(newQuietHours));

      expect(state.quietHours).toEqual(newQuietHours);
    });

    it('disables quiet hours', () => {
      const enabledState: NotificationPreferencesState = {
        ...initialState,
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '07:00',
        },
      };

      const state = reducer(
        enabledState,
        setQuietHours({
          enabled: false,
          startTime: '22:00',
          endTime: '07:00',
        }),
      );

      expect(state.quietHours.enabled).toBe(false);
    });
  });

  describe('setGroupingEnabled', () => {
    it('disables grouping', () => {
      const state = reducer(initialState, setGroupingEnabled(false));
      expect(state.groupingEnabled).toBe(false);
    });

    it('enables grouping', () => {
      const disabledState: NotificationPreferencesState = {
        ...initialState,
        groupingEnabled: false,
      };

      const state = reducer(disabledState, setGroupingEnabled(true));
      expect(state.groupingEnabled).toBe(true);
    });
  });

  describe('setPriorityThreshold', () => {
    it('sets a higher priority threshold', () => {
      const state = reducer(
        initialState,
        setPriorityThreshold(NotificationPriority.HIGH),
      );

      expect(state.priorityThreshold).toBe(NotificationPriority.HIGH);
    });

    it('sets threshold to LOW (shows all notifications)', () => {
      const highState: NotificationPreferencesState = {
        ...initialState,
        priorityThreshold: NotificationPriority.HIGH,
      };

      const state = reducer(
        highState,
        setPriorityThreshold(NotificationPriority.LOW),
      );

      expect(state.priorityThreshold).toBe(NotificationPriority.LOW);
    });
  });
});
