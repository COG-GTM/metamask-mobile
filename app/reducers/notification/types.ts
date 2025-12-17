import { NotificationTypes } from '../../util/notifications';

/**
 * Base notification properties
 */
export interface BaseNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  status: string;
  type: typeof NotificationTypes.TRANSACTION | typeof NotificationTypes.SIMPLE;
}

/**
 * Transaction notification
 */
export interface TransactionNotification extends BaseNotification {
  type: typeof NotificationTypes.TRANSACTION;
  transaction: {
    id: string;
    [key: string]: unknown;
  };
}

/**
 * Simple notification
 */
export interface SimpleNotification extends BaseNotification {
  type: typeof NotificationTypes.SIMPLE;
  title: string;
  description: string;
}

/**
 * Notification union type
 */
export type Notification = TransactionNotification | SimpleNotification;

/**
 * Notification reducer state
 */
export interface NotificationState {
  notifications: Notification[];
}
