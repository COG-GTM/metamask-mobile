import { Action } from 'redux';
import { NotificationTypesType } from '../../util/notifications';

/**
 * Transaction object used in transaction notifications
 */
export interface NotificationTransaction {
  id: string;
  [key: string]: unknown;
}

/**
 * Base notification properties shared by all notification types
 */
interface BaseNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number | null;
  status: string | null;
  type: NotificationTypesType;
}

/**
 * Simple notification with title and description
 */
export interface SimpleNotification extends BaseNotification {
  title: string;
  description: string;
}

/**
 * Transaction notification with transaction data
 */
export interface TransactionNotification extends BaseNotification {
  transaction: NotificationTransaction;
}

/**
 * Union type for all notification types
 */
export type Notification = SimpleNotification | TransactionNotification;

/**
 * Notification reducer state
 */
export interface NotificationState {
  notifications: Notification[];
}

/**
 * Action type enum for notification actions
 */
export enum NotificationActionType {
  HIDE_CURRENT_NOTIFICATION = 'HIDE_CURRENT_NOTIFICATION',
  HIDE_NOTIFICATION_BY_ID = 'HIDE_NOTIFICATION_BY_ID',
  MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION = 'MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION',
  MODIFY_OR_SHOW_SIMPLE_NOTIFICATION = 'MODIFY_OR_SHOW_SIMPLE_NOTIFICATION',
  REPLACE_NOTIFICATION_BY_ID = 'REPLACE_NOTIFICATION_BY_ID',
  REMOVE_NOTIFICATION_BY_ID = 'REMOVE_NOTIFICATION_BY_ID',
  REMOVE_CURRENT_NOTIFICATION = 'REMOVE_CURRENT_NOTIFICATION',
  REMOVE_NOT_VISIBLE_NOTIFICATIONS = 'REMOVE_NOT_VISIBLE_NOTIFICATIONS',
  SHOW_SIMPLE_NOTIFICATION = 'SHOW_SIMPLE_NOTIFICATION',
  SHOW_TRANSACTION_NOTIFICATION = 'SHOW_TRANSACTION_NOTIFICATION',
  UPDATE_NOTIFICATION_STATUS = 'UPDATE_NOTIFICATION_STATUS',
}

/**
 * Action to hide the current (first) notification
 */
export type HideCurrentNotificationAction =
  Action<NotificationActionType.HIDE_CURRENT_NOTIFICATION>;

/**
 * Action to hide a notification by its ID
 */
export interface HideNotificationByIdAction
  extends Action<NotificationActionType.HIDE_NOTIFICATION_BY_ID> {
  id: string;
}

/**
 * Action to modify or show a transaction notification
 */
export interface ModifyOrShowTransactionNotificationAction
  extends Action<NotificationActionType.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION> {
  id?: string;
  autodismiss: number | null;
  transaction: NotificationTransaction;
  status: string | null;
}

/**
 * Action to modify or show a simple notification
 */
export interface ModifyOrShowSimpleNotificationAction
  extends Action<NotificationActionType.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION> {
  id: string;
  autodismiss: number | null;
  title: string;
  description: string;
  status: string | null;
}

/**
 * Action to replace a notification by its ID
 */
export interface ReplaceNotificationByIdAction
  extends Action<NotificationActionType.REPLACE_NOTIFICATION_BY_ID> {
  id: string;
  notification: Notification;
}

/**
 * Action to remove a notification by its ID
 */
export interface RemoveNotificationByIdAction
  extends Action<NotificationActionType.REMOVE_NOTIFICATION_BY_ID> {
  id: string;
}

/**
 * Action to remove the current (first) notification
 */
export type RemoveCurrentNotificationAction =
  Action<NotificationActionType.REMOVE_CURRENT_NOTIFICATION>;

/**
 * Action to remove all non-visible notifications
 */
export type RemoveNotVisibleNotificationsAction =
  Action<NotificationActionType.REMOVE_NOT_VISIBLE_NOTIFICATIONS>;

/**
 * Action to show a simple notification
 */
export interface ShowSimpleNotificationAction
  extends Action<NotificationActionType.SHOW_SIMPLE_NOTIFICATION> {
  id: string;
  autodismiss?: number;
  title: string;
  description: string;
  status: string | null;
}

/**
 * Action to show a transaction notification
 */
export interface ShowTransactionNotificationAction
  extends Action<NotificationActionType.SHOW_TRANSACTION_NOTIFICATION> {
  autodismiss?: number;
  transaction: NotificationTransaction;
  status: string | null;
}

/**
 * Union type for all notification actions
 */
export type NotificationAction =
  | HideCurrentNotificationAction
  | HideNotificationByIdAction
  | ModifyOrShowTransactionNotificationAction
  | ModifyOrShowSimpleNotificationAction
  | ReplaceNotificationByIdAction
  | RemoveNotificationByIdAction
  | RemoveCurrentNotificationAction
  | RemoveNotVisibleNotificationsAction
  | ShowSimpleNotificationAction
  | ShowTransactionNotificationAction;
