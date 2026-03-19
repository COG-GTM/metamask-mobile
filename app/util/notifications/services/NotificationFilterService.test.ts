import { ChannelId } from '../androidChannels';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  EnhancedNotification,
} from '../types/notification-types';
import {
  getChannelIdForCategory,
  meetsMinimumPriority,
  isWithinQuietHours,
  shouldDisplayNotification,
  filterNotifications,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferences,
  QuietHoursConfig,
} from './NotificationFilterService';

const buildNotification = (
  overrides: Partial<EnhancedNotification> = {},
): EnhancedNotification => ({
  id: 'test-1',
  title: 'Test',
  category: NotificationCategory.TRANSACTION,
  priority: NotificationPriority.MEDIUM,
  status: NotificationStatus.UNREAD,
  createdAt: Date.now(),
  ...overrides,
});

describe('getChannelIdForCategory', () => {
  it('maps SECURITY to the security channel', () => {
    expect(getChannelIdForCategory(NotificationCategory.SECURITY)).toBe(
      ChannelId.SECURITY_NOTIFICATION_CHANNEL_ID,
    );
  });

  it('maps PRICE_ALERT to the price alert channel', () => {
    expect(getChannelIdForCategory(NotificationCategory.PRICE_ALERT)).toBe(
      ChannelId.PRICE_ALERT_NOTIFICATION_CHANNEL_ID,
    );
  });

  it('maps DAPP to the dapp channel', () => {
    expect(getChannelIdForCategory(NotificationCategory.DAPP)).toBe(
      ChannelId.DAPP_NOTIFICATION_CHANNEL_ID,
    );
  });

  it('maps ANNOUNCEMENT to the announcement channel', () => {
    expect(getChannelIdForCategory(NotificationCategory.ANNOUNCEMENT)).toBe(
      ChannelId.ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID,
    );
  });

  it('maps TRANSACTION to the default channel', () => {
    expect(getChannelIdForCategory(NotificationCategory.TRANSACTION)).toBe(
      ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
    );
  });

  it('maps SYSTEM to the default channel', () => {
    expect(getChannelIdForCategory(NotificationCategory.SYSTEM)).toBe(
      ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
    );
  });
});

describe('meetsMinimumPriority', () => {
  it('CRITICAL meets any threshold', () => {
    expect(
      meetsMinimumPriority(
        NotificationPriority.CRITICAL,
        NotificationPriority.CRITICAL,
      ),
    ).toBe(true);
    expect(
      meetsMinimumPriority(
        NotificationPriority.CRITICAL,
        NotificationPriority.LOW,
      ),
    ).toBe(true);
  });

  it('LOW does not meet HIGH threshold', () => {
    expect(
      meetsMinimumPriority(
        NotificationPriority.LOW,
        NotificationPriority.HIGH,
      ),
    ).toBe(false);
  });

  it('MEDIUM meets MEDIUM threshold', () => {
    expect(
      meetsMinimumPriority(
        NotificationPriority.MEDIUM,
        NotificationPriority.MEDIUM,
      ),
    ).toBe(true);
  });

  it('HIGH meets MEDIUM threshold', () => {
    expect(
      meetsMinimumPriority(
        NotificationPriority.HIGH,
        NotificationPriority.MEDIUM,
      ),
    ).toBe(true);
  });
});

describe('isWithinQuietHours', () => {
  const baseConfig: QuietHoursConfig = {
    enabled: true,
    startHour: 22,
    endHour: 7,
  };

  it('returns false when quiet hours are disabled', () => {
    expect(
      isWithinQuietHours(
        { ...baseConfig, enabled: false },
        new Date('2026-01-15T23:00:00'),
      ),
    ).toBe(false);
  });

  it('returns true during overnight quiet window (before midnight)', () => {
    expect(
      isWithinQuietHours(baseConfig, new Date('2026-01-15T23:00:00')),
    ).toBe(true);
  });

  it('returns true during overnight quiet window (after midnight)', () => {
    expect(
      isWithinQuietHours(baseConfig, new Date('2026-01-15T03:00:00')),
    ).toBe(true);
  });

  it('returns false outside overnight quiet window', () => {
    expect(
      isWithinQuietHours(baseConfig, new Date('2026-01-15T12:00:00')),
    ).toBe(false);
  });

  it('handles same-day range (e.g. 9-17)', () => {
    const daytimeConfig: QuietHoursConfig = {
      enabled: true,
      startHour: 9,
      endHour: 17,
    };
    expect(
      isWithinQuietHours(daytimeConfig, new Date('2026-01-15T12:00:00')),
    ).toBe(true);
    expect(
      isWithinQuietHours(daytimeConfig, new Date('2026-01-15T20:00:00')),
    ).toBe(false);
  });
});

describe('shouldDisplayNotification', () => {
  it('always shows CRITICAL notifications', () => {
    const notification = buildNotification({
      priority: NotificationPriority.CRITICAL,
      category: NotificationCategory.DAPP,
    });
    const prefs: NotificationPreferences = {
      categoryEnabled: { [NotificationCategory.DAPP]: false },
      minimumPriority: NotificationPriority.CRITICAL,
      quietHours: { enabled: true, startHour: 0, endHour: 24 },
    };
    expect(shouldDisplayNotification(notification, prefs)).toBe(true);
  });

  it('suppresses notifications with disabled category', () => {
    const notification = buildNotification({
      category: NotificationCategory.PRICE_ALERT,
      priority: NotificationPriority.HIGH,
    });
    const prefs: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      categoryEnabled: { [NotificationCategory.PRICE_ALERT]: false },
    };
    expect(shouldDisplayNotification(notification, prefs)).toBe(false);
  });

  it('suppresses notifications below priority threshold', () => {
    const notification = buildNotification({
      priority: NotificationPriority.LOW,
    });
    const prefs: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      minimumPriority: NotificationPriority.HIGH,
    };
    expect(shouldDisplayNotification(notification, prefs)).toBe(false);
  });

  it('shows notifications that meet all criteria', () => {
    const notification = buildNotification({
      category: NotificationCategory.TRANSACTION,
      priority: NotificationPriority.HIGH,
    });
    expect(
      shouldDisplayNotification(notification, DEFAULT_NOTIFICATION_PREFERENCES),
    ).toBe(true);
  });
});

describe('filterNotifications', () => {
  it('returns only notifications that pass the filter', () => {
    const notifications = [
      buildNotification({
        id: '1',
        category: NotificationCategory.SECURITY,
        priority: NotificationPriority.CRITICAL,
      }),
      buildNotification({
        id: '2',
        category: NotificationCategory.PRICE_ALERT,
        priority: NotificationPriority.LOW,
      }),
      buildNotification({
        id: '3',
        category: NotificationCategory.TRANSACTION,
        priority: NotificationPriority.HIGH,
      }),
    ];
    const prefs: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      minimumPriority: NotificationPriority.HIGH,
    };
    const result = filterNotifications(notifications, prefs);
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toEqual(['1', '3']);
  });

  it('returns an empty array when all are suppressed', () => {
    const notifications = [
      buildNotification({
        id: '1',
        category: NotificationCategory.DAPP,
        priority: NotificationPriority.LOW,
      }),
    ];
    const prefs: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      categoryEnabled: { [NotificationCategory.DAPP]: false },
    };
    expect(filterNotifications(notifications, prefs)).toHaveLength(0);
  });
});
