import {
  EnhancedNotification,
  NotificationCategory,
  NotificationPriority,
  PRIORITY_WEIGHTS,
} from '../util/notifications/types/notification-types';

// Simple event emitter implementation to avoid importing Node.js builtin 'events'
type Listener = (...args: unknown[]) => void;

class SimpleEventEmitter {
  private listeners: Map<string, Listener[]> = new Map();

  on(event: string, listener: Listener): this {
    const existing = this.listeners.get(event) ?? [];
    existing.push(listener);
    this.listeners.set(event, existing);
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.length === 0) return false;
    for (const handler of handlers) {
      handler(...args);
    }
    return true;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
}

/**
 * Rate-limit configuration for a single notification category.
 */
export interface RateLimitConfig {
  /** Maximum number of notifications allowed in the time window */
  maxCount: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Configuration options for NotificationQueueManager.
 */
export interface QueueManagerConfig {
  /** Per-category rate-limit settings */
  rateLimits: Partial<Record<NotificationCategory, RateLimitConfig>>;
  /** Default rate limit applied when no per-category limit is set */
  defaultRateLimit: RateLimitConfig;
  /** Whether notification grouping/collapsing is enabled */
  groupingEnabled: boolean;
}

/**
 * Events emitted by the NotificationQueueManager.
 */
export enum QueueEvent {
  /** Fired when a notification is ready to be displayed */
  NOTIFICATION_READY = 'notification:ready',
  /** Fired when notifications are grouped/collapsed */
  NOTIFICATION_GROUPED = 'notification:grouped',
  /** Fired when a notification is dropped due to rate limiting */
  NOTIFICATION_DROPPED = 'notification:dropped',
}

/** Internal record tracking the recent notification count for rate limiting. */
interface RateLimitEntry {
  timestamps: number[];
}

const DEFAULT_CONFIG: QueueManagerConfig = {
  rateLimits: {},
  defaultRateLimit: { maxCount: 10, windowMs: 60_000 },
  groupingEnabled: true,
};

/**
 * Priority-based notification queue with rate limiting and grouping.
 *
 * - Critical notifications bypass the queue entirely.
 * - Notifications are sorted by priority weight before processing.
 * - Rate limiting prevents notification spam on a per-category basis.
 * - Grouping collapses similar notifications when enabled.
 */
export class NotificationQueueManager extends SimpleEventEmitter {
  private queue: EnhancedNotification[] = [];
  private rateLimitMap: Map<NotificationCategory, RateLimitEntry> = new Map();
  private groupMap: Map<string, EnhancedNotification[]> = new Map();
  private config: QueueManagerConfig;
  private processing = false;

  constructor(config: Partial<QueueManagerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Enqueue a notification. Critical-priority notifications are emitted
   * immediately, bypassing the queue and rate limits.
   */
  enqueue(notification: EnhancedNotification): void {
    // Critical notifications bypass the queue
    if (notification.priority === NotificationPriority.CRITICAL) {
      this.emit(QueueEvent.NOTIFICATION_READY, notification);
      return;
    }

    if (!this.isWithinRateLimit(notification.category)) {
      this.emit(QueueEvent.NOTIFICATION_DROPPED, notification);
      return;
    }

    this.recordForRateLimit(notification.category);

    // Handle grouping
    if (
      this.config.groupingEnabled &&
      notification.grouping?.collapsible &&
      notification.grouping?.groupId
    ) {
      this.addToGroup(notification);
      return;
    }

    this.queue.push(notification);
    this.sortQueue();

    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process the queue, emitting notifications in priority order.
   */
  private processQueue(): void {
    this.processing = true;

    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      if (notification) {
        this.emit(QueueEvent.NOTIFICATION_READY, notification);
      }
    }

    this.processing = false;
  }

  /**
   * Sort the queue so higher-priority notifications are processed first.
   */
  private sortQueue(): void {
    this.queue.sort(
      (a, b) =>
        PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority],
    );
  }

  /**
   * Check whether a new notification for the given category is within
   * the configured rate limit.
   */
  private isWithinRateLimit(category: NotificationCategory): boolean {
    const limit =
      this.config.rateLimits[category] ?? this.config.defaultRateLimit;
    const entry = this.rateLimitMap.get(category);

    if (!entry) {
      return true;
    }

    const now = Date.now();
    const recentTimestamps = entry.timestamps.filter(
      (t) => now - t < limit.windowMs,
    );

    return recentTimestamps.length < limit.maxCount;
  }

  /**
   * Record a notification timestamp for rate-limiting purposes.
   */
  private recordForRateLimit(category: NotificationCategory): void {
    const limit =
      this.config.rateLimits[category] ?? this.config.defaultRateLimit;
    const entry = this.rateLimitMap.get(category) ?? { timestamps: [] };
    const now = Date.now();

    // Prune old timestamps
    entry.timestamps = entry.timestamps.filter(
      (t) => now - t < limit.windowMs,
    );
    entry.timestamps.push(now);

    this.rateLimitMap.set(category, entry);
  }

  /**
   * Add a notification to a collapse group. When a group receives a new
   * member, a grouped notification event is emitted.
   */
  private addToGroup(notification: EnhancedNotification): void {
    const grouping = notification.grouping;
    if (!grouping) {
      return;
    }
    const groupId = grouping.groupId;
    const existing = this.groupMap.get(groupId) ?? [];
    existing.push(notification);
    this.groupMap.set(groupId, existing);

    this.emit(QueueEvent.NOTIFICATION_GROUPED, {
      groupId,
      groupTitle: grouping.groupTitle,
      count: existing.length,
      notifications: existing,
    });
  }

  /**
   * Flush a specific group, emitting all individual notifications
   * and clearing the group.
   */
  flushGroup(groupId: string): void {
    const grouped = this.groupMap.get(groupId);
    if (grouped) {
      for (const n of grouped) {
        this.emit(QueueEvent.NOTIFICATION_READY, n);
      }
      this.groupMap.delete(groupId);
    }
  }

  /**
   * Clear the entire queue and all groups without emitting events.
   */
  clear(): void {
    this.queue = [];
    this.groupMap.clear();
    this.rateLimitMap.clear();
  }

  /** Returns the current number of notifications in the queue. */
  get queueSize(): number {
    return this.queue.length;
  }

  /** Returns the current number of active groups. */
  get groupCount(): number {
    return this.groupMap.size;
  }
}
