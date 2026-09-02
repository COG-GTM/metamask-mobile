/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import { ACTIONS } from '../../reducers/notification';

/**
 * The `ACTIONS` map is declared in a JavaScript module, so its values widen to
 * `string`. Every key matches its value, which allows narrowing them back to
 * string literal types so the actions below form a discriminated union.
 */
const NOTIFICATION_ACTIONS = ACTIONS as {
  [K in keyof typeof ACTIONS]: K;
};

export interface NotificationTransaction {
  id: string;
}

export interface Notification {
  id: string;
  isVisible?: boolean;
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
  type?: string;
  transaction?: NotificationTransaction;
}

export interface HideCurrentNotificationAction {
  type: typeof NOTIFICATION_ACTIONS.HIDE_CURRENT_NOTIFICATION;
}

export interface HideNotificationByIdAction {
  type: typeof NOTIFICATION_ACTIONS.HIDE_NOTIFICATION_BY_ID;
  id: string;
}

export interface TransactionNotificationPayload {
  autodismiss?: number | boolean;
  transaction: NotificationTransaction;
  status?: string;
}

export interface SimpleNotificationPayload {
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
}

export interface ModifyOrShowTransactionNotificationAction
  extends TransactionNotificationPayload {
  type: typeof NOTIFICATION_ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION;
}

export interface ModifyOrShowSimpleNotificationAction
  extends SimpleNotificationPayload {
  type: typeof NOTIFICATION_ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION;
}

export interface ReplaceNotificationByIdAction {
  type: typeof NOTIFICATION_ACTIONS.REPLACE_NOTIFICATION_BY_ID;
  notification: Notification;
  id: string;
}

export interface RemoveNotificationByIdAction {
  type: typeof NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION_BY_ID;
  id: string;
}

export interface RemoveCurrentNotificationAction {
  type: typeof NOTIFICATION_ACTIONS.REMOVE_CURRENT_NOTIFICATION;
}

export interface ShowSimpleNotificationAction
  extends SimpleNotificationPayload {
  type: typeof NOTIFICATION_ACTIONS.SHOW_SIMPLE_NOTIFICATION;
  id: string;
}

export interface ShowTransactionNotificationAction
  extends TransactionNotificationPayload {
  type: typeof NOTIFICATION_ACTIONS.SHOW_TRANSACTION_NOTIFICATION;
}

export interface RemoveNotVisibleNotificationsAction {
  type: typeof NOTIFICATION_ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS;
}

export type NotificationAction =
  | HideCurrentNotificationAction
  | HideNotificationByIdAction
  | ModifyOrShowTransactionNotificationAction
  | ModifyOrShowSimpleNotificationAction
  | ReplaceNotificationByIdAction
  | RemoveNotificationByIdAction
  | RemoveCurrentNotificationAction
  | ShowSimpleNotificationAction
  | ShowTransactionNotificationAction
  | RemoveNotVisibleNotificationsAction;

export function hideCurrentNotification(): HideCurrentNotificationAction {
  return {
    type: NOTIFICATION_ACTIONS.HIDE_CURRENT_NOTIFICATION,
  };
}

export function hideNotificationById(id: string): HideNotificationByIdAction {
  return {
    type: NOTIFICATION_ACTIONS.HIDE_NOTIFICATION_BY_ID,
    id,
  };
}

export function modifyOrShowTransactionNotificationById({
  autodismiss,
  transaction,
  status,
}: TransactionNotificationPayload): ModifyOrShowTransactionNotificationAction {
  return {
    type: NOTIFICATION_ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function modifyOrShowSimpleNotificationById({
  autodismiss,
  title,
  description,
  status,
}: SimpleNotificationPayload): ModifyOrShowSimpleNotificationAction {
  return {
    type: NOTIFICATION_ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

export function replaceNotificationById(
  notification: Notification,
): ReplaceNotificationByIdAction {
  return {
    type: NOTIFICATION_ACTIONS.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(
  id: string,
): RemoveNotificationByIdAction {
  return {
    type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION_BY_ID,
    id,
  };
}

export function removeCurrentNotification(): RemoveCurrentNotificationAction {
  return {
    type: NOTIFICATION_ACTIONS.REMOVE_CURRENT_NOTIFICATION,
  };
}

export function showSimpleNotification({
  autodismiss,
  title,
  description,
  status,
  id,
}: SimpleNotificationPayload & { id: string }): ShowSimpleNotificationAction {
  return {
    id,
    type: NOTIFICATION_ACTIONS.SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

export function showTransactionNotification({
  autodismiss,
  transaction,
  status,
}: TransactionNotificationPayload): ShowTransactionNotificationAction {
  return {
    type: NOTIFICATION_ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function removeNotVisibleNotifications(): RemoveNotVisibleNotificationsAction {
  return {
    type: NOTIFICATION_ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  };
}
