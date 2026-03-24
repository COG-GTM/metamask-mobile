/**
 * Unified Notification Types & Priority System
 *
 * Provides a comprehensive type system for categorizing, prioritizing,
 * and managing notifications across the MetaMask mobile application.
 */

/**
 * Categories for classifying notifications by their domain.
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
 * CRITICAL notifications bypass the queue and are shown immediately.
 */
export enum NotificationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Lifecycle status of a notification.
 */
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
  DISMISSED = 'dismissed',
}

/**
 * A call-to-action attached to a notification.
 */
export interface NotificationAction {
  /** Display label for the action button */
  label: string;
  /** Deep-link URL or route to navigate to when the action is triggered */
  url: string;
}

/**
 * Grouping metadata used to collapse similar notifications together.
 */
export interface NotificationGrouping {
  /** Identifier shared by notifications that belong to the same group */
  groupId: string;
  /** Human-readable title for the collapsed group (e.g., "5 new transactions") */
  groupTitle: string;
  /** Number of notifications currently collapsed into this group */
  count: number;
}

/**
 * Enhanced notification interface combining category, priority, status,
 * grouping, metadata, and actionable CTAs.
 */
export interface EnhancedNotification {
  /** Unique identifier for this notification */
  id: string;
  /** Notification category */
  category: NotificationCategory;
  /** Notification priority */
  priority: NotificationPriority;
  /** Current lifecycle status */
  status: NotificationStatus;
  /** Short title displayed in the notification header */
  title: string;
  /** Longer body text with notification details */
  body: string;
  /** ISO-8601 timestamp of when the notification was created */
  createdAt: string;
  /** ISO-8601 timestamp of when the notification was last read (if applicable) */
  readAt?: string;
  /** Optional grouping metadata for collapsing similar notifications */
  grouping?: NotificationGrouping;
  /** Arbitrary key-value metadata for downstream consumers */
  metadata?: Record<string, unknown>;
  /** Actionable CTAs displayed alongside the notification */
  actions?: NotificationAction[];
}
