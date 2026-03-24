/**
 * Notification Filter Service
 *
 * Filters incoming notifications against user preferences:
 * - Category-based filtering (enabled/disabled per category)
 * - Priority-based filtering (suppress below threshold)
 * - Quiet hours enforcement
 *
 * Returns filtered and transformed notifications ready for display.
 */

import {
  EnhancedNotification,
  NotificationCategory,
  NotificationPriority,
} from '../types/notification-types';
import {
  NotificationPreferencesState,
  QuietHoursConfig,
} from '../../../core/redux/slices/notificationPreferences';

/** Numeric weight for each priority level (higher = more urgent). */
const PRIORITY_WEIGHT: Record<NotificationPriority, number> = {
  [NotificationPriority.CRITICAL]: 4,
  [NotificationPriority.HIGH]: 3,
  [NotificationPriority.MEDIUM]: 2,
  [NotificationPriority.LOW]: 1,
};

/**
 * Parse an "HH:mm" string into total minutes since midnight.
 * Returns NaN when the input is malformed.
 */
function parseTimeToMinutes(time: string): number {
  const parts = time.split(':');
  if (parts.length !== 2) return NaN;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return NaN;
  return hours * 60 + minutes;
}

/**
 * Determine whether the supplied date falls inside the quiet hours window.
 *
 * Handles windows that span midnight (e.g., 22:00 → 07:00).
 */
export function isWithinQuietHours(
  quietHours: QuietHoursConfig,
  now: Date = new Date(),
): boolean {
  if (!quietHours.enabled) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = parseTimeToMinutes(quietHours.startTime);
  const end = parseTimeToMinutes(quietHours.endTime);

  if (isNaN(start) || isNaN(end)) return false;

  // Window does NOT span midnight (e.g., 08:00 → 18:00)
  if (start <= end) {
    return currentMinutes >= start && currentMinutes < end;
  }

  // Window spans midnight (e.g., 22:00 → 07:00)
  return currentMinutes >= start || currentMinutes < end;
}

/**
 * Check whether a notification's priority meets or exceeds the threshold.
 */
export function meetsPriorityThreshold(
  priority: NotificationPriority,
  threshold: NotificationPriority,
): boolean {
  return PRIORITY_WEIGHT[priority] >= PRIORITY_WEIGHT[threshold];
}

/**
 * Check whether a notification's category is enabled.
 */
export function isCategoryEnabled(
  category: NotificationCategory,
  toggles: Record<NotificationCategory, boolean>,
): boolean {
  return toggles[category] ?? true;
}

/**
 * Determine whether a single notification should be shown given the
 * current user preferences and time.
 *
 * CRITICAL-priority notifications always pass all filters.
 */
export function shouldShowNotification(
  notification: EnhancedNotification,
  preferences: NotificationPreferencesState,
  now: Date = new Date(),
): boolean {
  // CRITICAL notifications always pass
  if (notification.priority === NotificationPriority.CRITICAL) {
    return true;
  }

  // Category toggle check
  if (
    !isCategoryEnabled(notification.category, preferences.categoryToggles)
  ) {
    return false;
  }

  // Priority threshold check
  if (
    !meetsPriorityThreshold(
      notification.priority,
      preferences.priorityThreshold,
    )
  ) {
    return false;
  }

  // Quiet hours check
  if (isWithinQuietHours(preferences.quietHours, now)) {
    return false;
  }

  return true;
}

/**
 * Filter a list of notifications against the user's preferences.
 *
 * @returns Only the notifications that should be displayed.
 */
export function filterNotifications(
  notifications: EnhancedNotification[],
  preferences: NotificationPreferencesState,
  now: Date = new Date(),
): EnhancedNotification[] {
  return notifications.filter((n) =>
    shouldShowNotification(n, preferences, now),
  );
}
