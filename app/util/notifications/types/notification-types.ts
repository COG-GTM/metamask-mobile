/**
 * Enhanced notification type system for the MetaMask Mobile notification infrastructure.
 * Provides categories, priorities, and statuses to support channel-aware routing
 * and granular user preferences.
 */

/**
 * Notification categories used to classify and route notifications
 * to the appropriate Android notification channel.
 */
export enum NotificationCategory {
  TRANSACTION = 'transaction',
  SECURITY = 'security',
  PRICE_ALERT = 'price_alert',
  DAPP = 'dapp',
  ANNOUNCEMENT = 'announcement',
  SYSTEM = 'system',
}

/**
 * Priority levels that determine notification urgency and display behavior.
 * CRITICAL notifications bypass quiet hours and are always displayed.
 */
export enum NotificationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Tracks the lifecycle state of a notification.
 */
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
  DISMISSED = 'dismissed',
}

/**
 * An actionable CTA that can be attached to a notification.
 */
export interface NotificationAction {
  id: string;
  label: string;
  pressActionId: string;
}

/**
 * Extended notification interface that augments the base notification data
 * with category, priority, status, and optional grouping/actions.
 */
export interface EnhancedNotification {
  id: string;
  title: string;
  body?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: number;
  /** Opaque group key — notifications sharing the same groupId can be collapsed. */
  groupId?: string;
  /** Arbitrary key-value metadata for downstream consumers. */
  metadata?: Record<string, unknown>;
  /** Actionable CTAs displayed alongside the notification. */
  actions?: NotificationAction[];
  /** Raw payload data forwarded to the notification press handler. */
  data?: unknown;
}
