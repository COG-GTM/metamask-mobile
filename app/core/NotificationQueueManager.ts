/**
 * Notification Queue Manager
 *
 * Priority-based processing queue for notifications.
 * - CRITICAL notifications bypass the queue and are emitted immediately.
 * - Rate limiting prevents notification spam (configurable per-category).
 * - Grouping collapses similar notifications (e.g., "5 new transactions").
 * - Event-emitter pattern allows subscribers to react to processed notifications.
 */

import EventEmitter from 'events';
import {
  EnhancedNotification,
  NotificationCategory,
  NotificationPriority,
  NotificationGrouping,
} from '../util/notifications/types/notification-types';

/** Per-category rate-limit configuration. */
export interface RateLimitConfig {
  /** Maximum number of notifications allowed within the window */
  maxCount: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/** Configuration options for NotificationQueueManager. */
export interface QueueManagerConfig {
  /** Per-category rate limits. Categories without an entry are unlimited. */
  rateLimits?: Partial<Record<NotificationCategory, RateLimitConfig>>;
  /** Interval in ms at which the queue is drained. Default: 1000 */
  processIntervalMs?: number;
}

/** Events emitted by the queue manager. */
export enum QueueEvent {
  /** Fired for each notification that passes all filters and is ready for display. */
  NOTIFICATION_PROCESSED = 'notification_processed',
  /** Fired when a batch of grouped notifications is collapsed. */
  NOTIFICATION_GROUPED = 'notification_grouped',
  /** Fired when a notification is dropped due to rate limiting. */
  NOTIFICATION_RATE_LIMITED = 'notification_rate_limited',
}

/** Tracks timestamps used to enforce per-category rate limits. */
interface RateLimitBucket {
  timestamps: number[];
}

const DEFAULT_PROCESS_INTERVAL_MS = 1000;

class NotificationQueueManager extends EventEmitter {
  private queue: EnhancedNotification[] = [];
  private rateLimitBuckets: Map<NotificationCategory, RateLimitBucket> =
    new Map();
  private groupMap: Map<string, EnhancedNotification[]> = new Map();
  private config: Required<
    Pick<QueueManagerConfig, 'processIntervalMs'>
  > &
    QueueManagerConfig;
  private processTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: QueueManagerConfig = {}) {
    super();
    this.config = {
      ...config,
      processIntervalMs:
        config.processIntervalMs ?? DEFAULT_PROCESS_INTERVAL_MS,
    };
  }

  // ─── Public API ──────────────────────────────────────────────

  /**
   * Enqueue a notification. CRITICAL-priority notifications are emitted
   * immediately without entering the queue.
   */
  enqueue(notification: EnhancedNotification): void {
    if (notification.priority === NotificationPriority.CRITICAL) {
      this.emit(QueueEvent.NOTIFICATION_PROCESSED, notification);
      return;
    }

    if (this.isRateLimited(notification.category)) {
      this.emit(QueueEvent.NOTIFICATION_RATE_LIMITED, notification);
      return;
    }

    this.recordRateLimitTimestamp(notification.category);
    this.queue.push(notification);
  }

  /**
   * Start automatic queue processing at the configured interval.
   */
  startProcessing(): void {
    if (this.processTimer) return;
    this.processTimer = setInterval(() => {
      this.processQueue();
    }, this.config.processIntervalMs);
  }

  /**
   * Stop automatic queue processing.
   */
  stopProcessing(): void {
    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = null;
    }
  }

  /**
   * Manually trigger a single processing pass of the queue.
   */
  processQueue(): void {
    const pending = [...this.queue];
    this.queue = [];

    // Sort by priority (critical first, low last)
    const priorityOrder: Record<NotificationPriority, number> = {
      [NotificationPriority.CRITICAL]: 0,
      [NotificationPriority.HIGH]: 1,
      [NotificationPriority.MEDIUM]: 2,
      [NotificationPriority.LOW]: 3,
    };

    pending.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );

    for (const notification of pending) {
      if (notification.grouping) {
        this.addToGroup(notification);
      } else {
        this.emit(QueueEvent.NOTIFICATION_PROCESSED, notification);
      }
    }

    // Flush any accumulated groups
    this.flushGroups();
  }

  /**
   * Return a snapshot of the current queue (does not mutate).
   */
  getQueue(): ReadonlyArray<EnhancedNotification> {
    return [...this.queue];
  }

  /**
   * Return the number of items currently in the queue.
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Remove all items from the queue and reset rate-limit buckets.
   */
  clear(): void {
    this.queue = [];
    this.rateLimitBuckets.clear();
    this.groupMap.clear();
  }

  // ─── Rate Limiting ───────────────────────────────────────────

  private isRateLimited(category: NotificationCategory): boolean {
    const limitConfig = this.config.rateLimits?.[category];
    if (!limitConfig) return false;

    const bucket = this.rateLimitBuckets.get(category);
    if (!bucket) return false;

    const now = Date.now();
    const windowStart = now - limitConfig.windowMs;
    const recentTimestamps = bucket.timestamps.filter(
      (t) => t > windowStart,
    );

    return recentTimestamps.length >= limitConfig.maxCount;
  }

  private recordRateLimitTimestamp(category: NotificationCategory): void {
    if (!this.config.rateLimits?.[category]) return;

    let bucket = this.rateLimitBuckets.get(category);
    if (!bucket) {
      bucket = { timestamps: [] };
      this.rateLimitBuckets.set(category, bucket);
    }

    const now = Date.now();
    const windowMs =
      this.config.rateLimits[category]?.windowMs ?? 0;
    // Prune old timestamps outside the current window
    bucket.timestamps = bucket.timestamps.filter(
      (t) => t > now - windowMs,
    );
    bucket.timestamps.push(now);
  }

  // ─── Grouping ────────────────────────────────────────────────

  private addToGroup(notification: EnhancedNotification): void {
    const groupId = notification.grouping?.groupId;
    if (!groupId) return;

    const existing = this.groupMap.get(groupId) ?? [];
    existing.push(notification);
    this.groupMap.set(groupId, existing);
  }

  private flushGroups(): void {
    for (const [groupId, notifications] of this.groupMap.entries()) {
      if (notifications.length === 0) continue;

      if (notifications.length === 1) {
        this.emit(QueueEvent.NOTIFICATION_PROCESSED, notifications[0]);
      } else {
        // Emit the first notification with updated grouping metadata
        const representative = notifications[0];
        const grouping: NotificationGrouping = {
          groupId,
          groupTitle:
            representative.grouping?.groupTitle ??
            `${notifications.length} notifications`,
          count: notifications.length,
        };

        const grouped: EnhancedNotification = {
          ...representative,
          grouping,
        };

        this.emit(QueueEvent.NOTIFICATION_GROUPED, grouped);
      }
    }

    this.groupMap.clear();
  }
}

export default NotificationQueueManager;
