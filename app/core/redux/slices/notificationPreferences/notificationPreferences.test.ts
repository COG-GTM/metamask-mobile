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
  describe('initial state', () => {
    it('has all categories enabled by default', () => {
      const state = reducer(undefined, { type: 'unknown' });
      for (const category of Object.values(NotificationCategory)) {
        expect(state.categoryToggles[category]).toBe(true);
      }
    });

    it('has quiet hours disabled by default', () => {
      const state = reducer(undefined, { type: 'unknown' });
      expect(state.quietHours.enabled).toBe(false);
      expect(state.quietHours.startTime).toBe('22:00');
      expect(state.quietHours.endTime).toBe('07:00');
    });

    it('has grouping enabled by default', () => {
      const state = reducer(undefined, { type: 'unknown' });
      expect(state.groupingEnabled).toBe(true);
    });

    it('has LOW as default priority threshold', () => {
      const state = reducer(undefined, { type: 'unknown' });
      expect(state.priorityThreshold).toBe(NotificationPriority.LOW);
    });
  });

  describe('toggleCategory', () => {
    it('disables a category', () => {
      const state = reducer(
        initialState,
        toggleCategory({
          category: NotificationCategory.DAPP,
          enabled: false,
        }),
      );
      expect(state.categoryToggles[NotificationCategory.DAPP]).toBe(false);
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
      const newConfig = {
        enabled: true,
        startTime: '23:00',
        endTime: '06:00',
      };
      const state = reducer(initialState, setQuietHours(newConfig));
      expect(state.quietHours).toEqual(newConfig);
    });
  });

  describe('setGroupingEnabled', () => {
    it('toggles grouping off', () => {
      const state = reducer(initialState, setGroupingEnabled(false));
      expect(state.groupingEnabled).toBe(false);
    });

    it('toggles grouping on', () => {
      const disabledState: NotificationPreferencesState = {
        ...initialState,
        groupingEnabled: false,
      };
      const state = reducer(disabledState, setGroupingEnabled(true));
      expect(state.groupingEnabled).toBe(true);
    });
  });

  describe('setPriorityThreshold', () => {
    it('updates the priority threshold', () => {
      const state = reducer(
        initialState,
        setPriorityThreshold(NotificationPriority.HIGH),
      );
      expect(state.priorityThreshold).toBe(NotificationPriority.HIGH);
    });
  });
});
