import { NotificationTypes } from '../../util/notifications';

export type NotificationType =
  | typeof NotificationTypes.TRANSACTION
  | typeof NotificationTypes.SIMPLE;

export interface BaseNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  status?: string;
  type: NotificationType;
}

export interface TransactionNotification extends BaseNotification {
  type: typeof NotificationTypes.TRANSACTION;
  transaction: {
    id: string;
    [key: string]: unknown;
  };
}

export interface SimpleNotification extends BaseNotification {
  type: typeof NotificationTypes.SIMPLE;
  title?: string;
  description?: string;
}

export type Notification = TransactionNotification | SimpleNotification;

export interface NotificationState {
  notifications: Notification[];
}
