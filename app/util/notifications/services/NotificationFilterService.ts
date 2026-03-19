import { ChannelId } from '../androidChannels';
import {
  NotificationCategory,
  NotificationPriority,
  EnhancedNotification,
} from '../types/notification-types';

/**
 * Maps a NotificationCategory to the appropriate Android ChannelId.
 */
export function getChannelIdForCategory(
  category: NotificationCategory,
): ChannelId {
  switch (category) {
    case NotificationCategory.SECURITY:
      return ChannelId.SECURITY_NOTIFICATION_CHANNEL_ID;
    case NotificationCategory.PRICE_ALERT:
      return ChannelId.PRICE_ALERT_NOTIFICATION_CHANNEL_ID;
    case NotificationCategory.DAPP:
      return ChannelId.DAPP_NOTIFICATION_CHANNEL_ID;
    case NotificationCategory.ANNOUNCEMENT:
      return ChannelId.ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID;
    case NotificationCategory.TRANSACTION:
    case NotificationCategory.SYSTEM:
    default:
      return ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID;
  }
}

/**
 * Priority ordering used for comparisons.
 * Lower index = higher priority.
 */
const PRIORITY_ORDER: NotificationPriority[] = [
  NotificationPriority.CRITICAL,
  NotificationPriority.HIGH,
  NotificationPriority.MEDIUM,
  NotificationPriority.LOW,
];

/**
 * Returns true when `priority` meets or exceeds `threshold`.
 */
export function meetsMinimumPriority(
  priority: NotificationPriority,
  threshold: NotificationPriority,
): boolean {
  return PRIORITY_ORDER.indexOf(priority) <= PRIORITY_ORDER.indexOf(threshold);
}

export interface QuietHoursConfig {
  enabled: boolean;
  /** Start hour in 24-h format (0-23). */
  startHour: number;
  /** End hour in 24-h format (0-23). */
  endHour: number;
}

/**
 * Returns true when the current time falls inside the configured quiet window.
 * Handles overnight ranges (e.g. 22:00 → 07:00).
 */
export function isWithinQuietHours(
  config: QuietHoursConfig,
  now: Date = new Date(),
): boolean {
  if (!config.enabled) {
    return false;
  }

  const currentHour = now.getHours();

  if (config.startHour <= config.endHour) {
    return currentHour >= config.startHour && currentHour < config.endHour;
  }
  // Overnight window (e.g. 22 → 7)
  return currentHour >= config.startHour || currentHour < config.endHour;
}

export interface NotificationPreferences {
  /** Per-category enable/disable toggles. Missing keys default to enabled. */
  categoryEnabled: Partial<Record<NotificationCategory, boolean>>;
  /** Minimum priority a notification must have to be shown. Defaults to LOW. */
  minimumPriority: NotificationPriority;
  /** Quiet hours configuration. */
  quietHours: QuietHoursConfig;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  categoryEnabled: {},
  minimumPriority: NotificationPriority.LOW,
  quietHours: {
    enabled: false,
    startHour: 22,
    endHour: 7,
  },
};

/**
 * Determines whether a notification should be displayed based on user preferences.
 *
 * Filtering rules (applied in order):
 * 1. CRITICAL notifications always pass — they bypass quiet hours and priority checks.
 * 2. Category must be enabled (missing key = enabled).
 * 3. Priority must meet or exceed the user-configured minimum threshold.
 * 4. Notification must not fall within quiet hours.
 */
export function shouldDisplayNotification(
  notification: EnhancedNotification,
  preferences: NotificationPreferences,
): boolean {
  // Rule 1 – CRITICAL notifications are never suppressed
  if (notification.priority === NotificationPriority.CRITICAL) {
    return true;
  }

  // Rule 2 – category toggle
  const categoryOn =
    preferences.categoryEnabled[notification.category] ?? true;
  if (!categoryOn) {
    return false;
  }

  // Rule 3 – priority threshold
  if (
    !meetsMinimumPriority(notification.priority, preferences.minimumPriority)
  ) {
    return false;
  }

  // Rule 4 – quiet hours
  if (isWithinQuietHours(preferences.quietHours)) {
    return false;
  }

  return true;
}

/**
 * Filters an array of notifications, returning only those that should be shown.
 */
export function filterNotifications(
  notifications: EnhancedNotification[],
  preferences: NotificationPreferences,
): EnhancedNotification[] {
  return notifications.filter((n) => shouldDisplayNotification(n, preferences));
}
