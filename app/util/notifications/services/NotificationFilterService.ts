import {
  EnhancedNotification,
  NotificationPriority,
  PRIORITY_WEIGHTS,
} from '../types/notification-types';
import {
  NotificationPreferencesState,
  QuietHoursConfig,
} from '../../../core/redux/slices/notificationPreferences';

/**
 * Service that filters incoming notifications against user preferences.
 *
 * Responsibilities:
 * - Enforce category-based enable/disable toggles
 * - Apply priority-threshold filtering
 * - Enforce quiet-hours suppression
 * - Return a filtered and transformed list ready for display
 */
export class NotificationFilterService {
  /**
   * Filter a batch of notifications according to user preferences.
   *
   * @param notifications - The incoming notifications to evaluate.
   * @param preferences - The current notification preferences state.
   * @returns The subset of notifications that pass all filters.
   */
  filterNotifications(
    notifications: EnhancedNotification[],
    preferences: NotificationPreferencesState,
  ): EnhancedNotification[] {
    return notifications.filter((notification) =>
      this.shouldDisplay(notification, preferences),
    );
  }

  /**
   * Determine whether a single notification should be displayed.
   *
   * Evaluation order:
   * 1. Critical-priority notifications always pass.
   * 2. Category toggle check.
   * 3. Priority threshold check.
   * 4. Quiet hours check.
   */
  shouldDisplay(
    notification: EnhancedNotification,
    preferences: NotificationPreferencesState,
  ): boolean {
    // Critical notifications always pass
    if (notification.priority === NotificationPriority.CRITICAL) {
      return true;
    }

    // Category toggle check
    if (!this.isCategoryEnabled(notification, preferences)) {
      return false;
    }

    // Priority threshold check
    if (!this.meetsMinimumPriority(notification, preferences)) {
      return false;
    }

    // Quiet hours check
    if (this.isDuringQuietHours(preferences.quietHours)) {
      return false;
    }

    return true;
  }

  /**
   * Check whether the notification's category is enabled.
   */
  private isCategoryEnabled(
    notification: EnhancedNotification,
    preferences: NotificationPreferencesState,
  ): boolean {
    return preferences.categoryToggles[notification.category] !== false;
  }

  /**
   * Check whether the notification meets the minimum priority threshold.
   */
  private meetsMinimumPriority(
    notification: EnhancedNotification,
    preferences: NotificationPreferencesState,
  ): boolean {
    const notificationWeight = PRIORITY_WEIGHTS[notification.priority];
    const thresholdWeight = PRIORITY_WEIGHTS[preferences.priorityThreshold];
    return notificationWeight >= thresholdWeight;
  }

  /**
   * Check whether the current time falls within the quiet-hours window.
   *
   * Supports windows that span midnight (e.g., 22:00 – 07:00).
   *
   * @param quietHours - The quiet hours configuration.
   * @param now - Optional Date for testing; defaults to current time.
   */
  isDuringQuietHours(quietHours: QuietHoursConfig, now?: Date): boolean {
    if (!quietHours.enabled) {
      return false;
    }

    const current = now ?? new Date();
    const currentMinutes =
      current.getHours() * 60 + current.getMinutes();

    const startMinutes = this.parseTimeToMinutes(quietHours.startTime);
    const endMinutes = this.parseTimeToMinutes(quietHours.endTime);

    // Window does NOT span midnight (e.g., 09:00 – 17:00)
    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    // Window spans midnight (e.g., 22:00 – 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  /**
   * Parse an "HH:MM" string into total minutes since midnight.
   */
  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
