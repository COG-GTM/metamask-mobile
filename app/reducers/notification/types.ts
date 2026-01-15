import { NotificationTypesType } from '../../util/notifications';

/**
 * Base notification properties
 */
export interface BaseNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  status: string;
  type: NotificationTypesType;
}

/**
 * Transaction notification
 */
export interface TransactionNotification extends BaseNotification {
  transaction: {
    id: string;
    [key: string]: unknown;
  };
}

/**
 * Simple notification
 */
export interface SimpleNotification extends BaseNotification {
  title: string;
  description: string;
}

/**
 * Union type for all notification types
 */
export type Notification = TransactionNotification | SimpleNotification;

/**
 * Notification state
 */
export interface NotificationState {
  notifications: Notification[];
  // Allow additional properties for flexibility with test mocks and future extensions
  [key: string]: unknown;
}
