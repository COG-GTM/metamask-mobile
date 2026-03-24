import {
  isWithinQuietHours,
  meetsPriorityThreshold,
  isCategoryEnabled,
  shouldShowNotification,
  filterNotifications,
} from './NotificationFilterService';
import {
  EnhancedNotification,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
} from '../types/notification-types';
import { NotificationPreferencesState } from '../../../core/redux/slices/notificationPreferences';

const createNotification = (
  overrides: Partial<EnhancedNotification> = {},
): EnhancedNotification => ({
  id: 'test-1',
  category: NotificationCategory.TRANSACTION,
  priority: NotificationPriority.MEDIUM,
  status: NotificationStatus.UNREAD,
  title: 'Test',
  body: 'Test body',
  createdAt: new Date().toISOString(),
  ...overrides,
});

const defaultPreferences: NotificationPreferencesState = {
  categoryToggles: {
    [NotificationCategory.TRANSACTION]: true,
    [NotificationCategory.SECURITY]: true,
    [NotificationCategory.PRICE_ALERT]: true,
    [NotificationCategory.DAPP]: true,
    [NotificationCategory.ANNOUNCEMENT]: true,
    [NotificationCategory.SYSTEM]: true,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
  },
  groupingEnabled: true,
  priorityThreshold: NotificationPriority.LOW,
};

describe('NotificationFilterService', () => {
  describe('isWithinQuietHours', () => {
    it('returns false when quiet hours are disabled', () => {
      const quietHours = { enabled: false, startTime: '22:00', endTime: '07:00' };
      const now = new Date('2026-01-01T23:00:00');
      expect(isWithinQuietHours(quietHours, now)).toBe(false);
    });

    it('returns true when current time is inside a midnight-spanning window', () => {
      const quietHours = { enabled: true, startTime: '22:00', endTime: '07:00' };
      // 23:00 is between 22:00 and 07:00
      const now = new Date('2026-01-01T23:00:00');
      expect(isWithinQuietHours(quietHours, now)).toBe(true);
    });

    it('returns true when current time is after midnight in a spanning window', () => {
      const quietHours = { enabled: true, startTime: '22:00', endTime: '07:00' };
      // 03:00 is between 22:00 and 07:00
      const now = new Date('2026-01-02T03:00:00');
      expect(isWithinQuietHours(quietHours, now)).toBe(true);
    });

    it('returns false when current time is outside a midnight-spanning window', () => {
      const quietHours = { enabled: true, startTime: '22:00', endTime: '07:00' };
      // 12:00 is outside 22:00–07:00
      const now = new Date('2026-01-01T12:00:00');
      expect(isWithinQuietHours(quietHours, now)).toBe(false);
    });

    it('handles a non-spanning window correctly', () => {
      const quietHours = { enabled: true, startTime: '08:00', endTime: '18:00' };
      const insideNow = new Date('2026-01-01T10:00:00');
      const outsideNow = new Date('2026-01-01T19:00:00');
      expect(isWithinQuietHours(quietHours, insideNow)).toBe(true);
      expect(isWithinQuietHours(quietHours, outsideNow)).toBe(false);
    });

    it('returns false for malformed time strings', () => {
      const quietHours = { enabled: true, startTime: 'bad', endTime: '07:00' };
      const now = new Date('2026-01-01T23:00:00');
      expect(isWithinQuietHours(quietHours, now)).toBe(false);
    });
  });

  describe('meetsPriorityThreshold', () => {
    it('CRITICAL meets any threshold', () => {
      expect(
        meetsPriorityThreshold(
          NotificationPriority.CRITICAL,
          NotificationPriority.CRITICAL,
        ),
      ).toBe(true);
    });

    it('LOW does not meet HIGH threshold', () => {
      expect(
        meetsPriorityThreshold(
          NotificationPriority.LOW,
          NotificationPriority.HIGH,
        ),
      ).toBe(false);
    });

    it('MEDIUM meets MEDIUM threshold', () => {
      expect(
        meetsPriorityThreshold(
          NotificationPriority.MEDIUM,
          NotificationPriority.MEDIUM,
        ),
      ).toBe(true);
    });

    it('HIGH meets LOW threshold', () => {
      expect(
        meetsPriorityThreshold(
          NotificationPriority.HIGH,
          NotificationPriority.LOW,
        ),
      ).toBe(true);
    });
  });

  describe('isCategoryEnabled', () => {
    it('returns true for an enabled category', () => {
      expect(
        isCategoryEnabled(
          NotificationCategory.TRANSACTION,
          defaultPreferences.categoryToggles,
        ),
      ).toBe(true);
    });

    it('returns false for a disabled category', () => {
      const toggles = {
        ...defaultPreferences.categoryToggles,
        [NotificationCategory.DAPP]: false,
      };
      expect(
        isCategoryEnabled(NotificationCategory.DAPP, toggles),
      ).toBe(false);
    });
  });

  describe('shouldShowNotification', () => {
    it('always shows CRITICAL notifications regardless of preferences', () => {
      const prefs: NotificationPreferencesState = {
        ...defaultPreferences,
        categoryToggles: {
          ...defaultPreferences.categoryToggles,
          [NotificationCategory.SECURITY]: false,
        },
        quietHours: { enabled: true, startTime: '00:00', endTime: '23:59' },
        priorityThreshold: NotificationPriority.CRITICAL,
      };

      const notification = createNotification({
        category: NotificationCategory.SECURITY,
        priority: NotificationPriority.CRITICAL,
      });

      expect(shouldShowNotification(notification, prefs)).toBe(true);
    });

    it('filters out a notification with a disabled category', () => {
      const prefs: NotificationPreferencesState = {
        ...defaultPreferences,
        categoryToggles: {
          ...defaultPreferences.categoryToggles,
          [NotificationCategory.DAPP]: false,
        },
      };

      const notification = createNotification({
        category: NotificationCategory.DAPP,
        priority: NotificationPriority.HIGH,
      });

      expect(shouldShowNotification(notification, prefs)).toBe(false);
    });

    it('filters out a notification below the priority threshold', () => {
      const prefs: NotificationPreferencesState = {
        ...defaultPreferences,
        priorityThreshold: NotificationPriority.HIGH,
      };

      const notification = createNotification({
        priority: NotificationPriority.LOW,
      });

      expect(shouldShowNotification(notification, prefs)).toBe(false);
    });

    it('filters out a notification during quiet hours', () => {
      const prefs: NotificationPreferencesState = {
        ...defaultPreferences,
        quietHours: { enabled: true, startTime: '22:00', endTime: '07:00' },
      };

      const notification = createNotification({
        priority: NotificationPriority.MEDIUM,
      });
      const now = new Date('2026-01-01T23:30:00');

      expect(shouldShowNotification(notification, prefs, now)).toBe(false);
    });

    it('shows a notification that passes all filters', () => {
      const notification = createNotification({
        priority: NotificationPriority.HIGH,
      });
      const now = new Date('2026-01-01T12:00:00');

      expect(
        shouldShowNotification(notification, defaultPreferences, now),
      ).toBe(true);
    });
  });

  describe('filterNotifications', () => {
    it('returns only notifications that pass all filters', () => {
      const prefs: NotificationPreferencesState = {
        ...defaultPreferences,
        categoryToggles: {
          ...defaultPreferences.categoryToggles,
          [NotificationCategory.DAPP]: false,
        },
      };

      const notifications = [
        createNotification({
          id: '1',
          category: NotificationCategory.TRANSACTION,
          priority: NotificationPriority.HIGH,
        }),
        createNotification({
          id: '2',
          category: NotificationCategory.DAPP,
          priority: NotificationPriority.HIGH,
        }),
        createNotification({
          id: '3',
          category: NotificationCategory.SECURITY,
          priority: NotificationPriority.CRITICAL,
        }),
      ];

      const now = new Date('2026-01-01T12:00:00');
      const result = filterNotifications(notifications, prefs, now);
      expect(result).toHaveLength(2);
      expect(result.map((n) => n.id)).toEqual(['1', '3']);
    });

    it('returns an empty array when all notifications are filtered', () => {
      const prefs: NotificationPreferencesState = {
        ...defaultPreferences,
        priorityThreshold: NotificationPriority.CRITICAL,
      };

      const notifications = [
        createNotification({ priority: NotificationPriority.LOW }),
        createNotification({ priority: NotificationPriority.MEDIUM }),
      ];

      const result = filterNotifications(notifications, prefs);
      expect(result).toHaveLength(0);
    });
  });
});
