import { NotificationFilterService } from './NotificationFilterService';
import {
  EnhancedNotification,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
} from '../types/notification-types';
import {
  NotificationPreferencesState,
} from '../../../core/redux/slices/notificationPreferences';

const createNotification = (
  overrides: Partial<EnhancedNotification> = {},
): EnhancedNotification => ({
  id: `notif-${Math.random()}`,
  title: 'Test Notification',
  body: 'Test body',
  category: NotificationCategory.TRANSACTION,
  priority: NotificationPriority.MEDIUM,
  status: NotificationStatus.UNREAD,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createPreferences = (
  overrides: Partial<NotificationPreferencesState> = {},
): NotificationPreferencesState => ({
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
  ...overrides,
});

describe('NotificationFilterService', () => {
  let service: NotificationFilterService;

  beforeEach(() => {
    service = new NotificationFilterService();
  });

  describe('shouldDisplay', () => {
    it('always displays CRITICAL priority notifications', () => {
      const preferences = createPreferences({
        categoryToggles: {
          ...createPreferences().categoryToggles,
          [NotificationCategory.TRANSACTION]: false,
        },
        quietHours: { enabled: true, startTime: '00:00', endTime: '23:59' },
        priorityThreshold: NotificationPriority.CRITICAL,
      });

      const notification = createNotification({
        priority: NotificationPriority.CRITICAL,
        category: NotificationCategory.TRANSACTION,
      });

      expect(service.shouldDisplay(notification, preferences)).toBe(true);
    });

    it('filters out notifications for disabled categories', () => {
      const preferences = createPreferences({
        categoryToggles: {
          ...createPreferences().categoryToggles,
          [NotificationCategory.DAPP]: false,
        },
      });

      const notification = createNotification({
        category: NotificationCategory.DAPP,
      });

      expect(service.shouldDisplay(notification, preferences)).toBe(false);
    });

    it('filters out notifications below the priority threshold', () => {
      const preferences = createPreferences({
        priorityThreshold: NotificationPriority.HIGH,
      });

      const lowNotification = createNotification({
        priority: NotificationPriority.LOW,
      });
      const mediumNotification = createNotification({
        priority: NotificationPriority.MEDIUM,
      });
      const highNotification = createNotification({
        priority: NotificationPriority.HIGH,
      });

      expect(service.shouldDisplay(lowNotification, preferences)).toBe(false);
      expect(service.shouldDisplay(mediumNotification, preferences)).toBe(
        false,
      );
      expect(service.shouldDisplay(highNotification, preferences)).toBe(true);
    });

    it('allows notifications when all filters pass', () => {
      const preferences = createPreferences();
      const notification = createNotification();

      expect(service.shouldDisplay(notification, preferences)).toBe(true);
    });
  });

  describe('isDuringQuietHours', () => {
    it('returns false when quiet hours are disabled', () => {
      const quietHours = {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00',
      };

      expect(service.isDuringQuietHours(quietHours)).toBe(false);
    });

    it('returns true during quiet hours (same-day window)', () => {
      const quietHours = {
        enabled: true,
        startTime: '09:00',
        endTime: '17:00',
      };

      // 12:00 PM is within 09:00–17:00
      const noon = new Date('2025-01-15T12:00:00');
      expect(service.isDuringQuietHours(quietHours, noon)).toBe(true);
    });

    it('returns false outside quiet hours (same-day window)', () => {
      const quietHours = {
        enabled: true,
        startTime: '09:00',
        endTime: '17:00',
      };

      // 20:00 is outside 09:00–17:00
      const evening = new Date('2025-01-15T20:00:00');
      expect(service.isDuringQuietHours(quietHours, evening)).toBe(false);
    });

    it('returns true during quiet hours (midnight-spanning window)', () => {
      const quietHours = {
        enabled: true,
        startTime: '22:00',
        endTime: '07:00',
      };

      // 23:30 is within 22:00–07:00
      const lateNight = new Date('2025-01-15T23:30:00');
      expect(service.isDuringQuietHours(quietHours, lateNight)).toBe(true);

      // 03:00 is within 22:00–07:00
      const earlyMorning = new Date('2025-01-15T03:00:00');
      expect(service.isDuringQuietHours(quietHours, earlyMorning)).toBe(true);
    });

    it('returns false outside quiet hours (midnight-spanning window)', () => {
      const quietHours = {
        enabled: true,
        startTime: '22:00',
        endTime: '07:00',
      };

      // 12:00 is outside 22:00–07:00
      const midday = new Date('2025-01-15T12:00:00');
      expect(service.isDuringQuietHours(quietHours, midday)).toBe(false);
    });

    it('suppresses non-critical notifications during quiet hours', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:00:00'));

      const preferences = createPreferences({
        quietHours: {
          enabled: true,
          startTime: '00:00',
          endTime: '23:59',
        },
      });

      const notification = createNotification({
        priority: NotificationPriority.HIGH,
      });

      expect(service.shouldDisplay(notification, preferences)).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('filterNotifications', () => {
    it('filters a batch of notifications', () => {
      const preferences = createPreferences({
        categoryToggles: {
          ...createPreferences().categoryToggles,
          [NotificationCategory.ANNOUNCEMENT]: false,
        },
      });

      const notifications = [
        createNotification({
          category: NotificationCategory.TRANSACTION,
        }),
        createNotification({
          category: NotificationCategory.ANNOUNCEMENT,
        }),
        createNotification({
          category: NotificationCategory.SECURITY,
        }),
      ];

      const result = service.filterNotifications(notifications, preferences);

      expect(result).toHaveLength(2);
      expect(
        result.every(
          (n) => n.category !== NotificationCategory.ANNOUNCEMENT,
        ),
      ).toBe(true);
    });

    it('returns an empty array when all notifications are filtered out', () => {
      const preferences = createPreferences({
        priorityThreshold: NotificationPriority.CRITICAL,
      });

      const notifications = [
        createNotification({ priority: NotificationPriority.LOW }),
        createNotification({ priority: NotificationPriority.MEDIUM }),
      ];

      const result = service.filterNotifications(notifications, preferences);
      expect(result).toHaveLength(0);
    });
  });
});
