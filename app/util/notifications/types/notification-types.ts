/**
 * Unified Notification Types & Priority System
 *
 * Provides a standardized set of enums and interfaces for the enhanced
 * notification system, including categories, priorities, statuses,
 * and the EnhancedNotification interface.
 */

/**
 * Notification categories that classify the type of notification.
 */
export enum NotificationCategory {
  TRANSACTION = 'TRANSACTION',
  SECURITY = 'SECURITY',
  PRICE_ALERT = 'PRICE_ALERT',
  DAPP = 'DAPP',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  SYSTEM = 'SYSTEM',
}

/**
 * Priority levels that determine how urgently a notification is processed
 * and displayed.
 */
export enum NotificationPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/**
 * Lifecycle statuses for a notification.
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
  DISMISSED = 'DISMISSED',
}

/**
 * A call-to-action button attached to a notification.
 */
export interface NotificationAction {
  /** Label displayed on the CTA button */
  label: string;
  /** Deep-link or navigation route triggered by the CTA */
  actionUrl: string;
}

/**
 * Grouping metadata used to collapse similar notifications
 * (e.g., "5 new transactions").
 */
export interface NotificationGrouping {
  /** Identifier shared by notifications that should be grouped */
  groupId: string;
  /** Human-readable group title (e.g., "Pending Transactions") */
  groupTitle: string;
  /** Whether this notification can be collapsed into its group */
  collapsible: boolean;
}

/**
 * The enhanced notification interface combining category, priority,
 * status, grouping, metadata, and actionable CTAs.
 */
export interface EnhancedNotification {
  /** Unique identifier for the notification */
  id: string;
  /** Notification title */
  title: string;
  /** Notification body / description */
  body: string;
  /** Category of the notification */
  category: NotificationCategory;
  /** Priority level */
  priority: NotificationPriority;
  /** Current lifecycle status */
  status: NotificationStatus;
  /** ISO-8601 timestamp when the notification was created */
  createdAt: string;
  /** Optional grouping metadata */
  grouping?: NotificationGrouping;
  /** Arbitrary metadata attached to the notification */
  metadata?: Record<string, unknown>;
  /** Optional list of actionable CTAs */
  actions?: NotificationAction[];
}

/**
 * Numeric weights mapped to each priority level.
 * Higher weight = higher urgency.
 */
export const PRIORITY_WEIGHTS: Record<NotificationPriority, number> = {
  [NotificationPriority.CRITICAL]: 4,
  [NotificationPriority.HIGH]: 3,
  [NotificationPriority.MEDIUM]: 2,
  [NotificationPriority.LOW]: 1,
};
