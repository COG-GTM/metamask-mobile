/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import { ACTIONS } from '../../reducers/notification';

export type AutodismissValue = number | boolean | null;

export interface SimpleNotificationPayload {
  autodismiss?: AutodismissValue;
  title?: string;
  description?: string;
  status?: string;
  id?: number | string;
}

export interface TransactionNotificationPayload {
  autodismiss?: AutodismissValue;
  transaction: {
    id?: number | string;
    [key: string]: unknown;
  };
  status?: string;
}

export interface NotificationItem {
  id: number | string;
  isVisible?: boolean;
  autodismiss?: AutodismissValue;
  title?: string;
  description?: string;
  status?: string;
  transaction?: { id?: number | string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface HideCurrentNotificationAction {
  type: typeof ACTIONS.HIDE_CURRENT_NOTIFICATION;
}

export interface HideNotificationByIdAction {
  type: typeof ACTIONS.HIDE_NOTIFICATION_BY_ID;
  id: number | string;
}

export interface ModifyOrShowTransactionNotificationAction {
  type: typeof ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION;
  autodismiss?: AutodismissValue;
  transaction: TransactionNotificationPayload['transaction'];
  status?: string;
}

export interface ModifyOrShowSimpleNotificationAction {
  type: typeof ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION;
  autodismiss?: AutodismissValue;
  title?: string;
  description?: string;
  status?: string;
}

export interface ReplaceNotificationByIdAction {
  type: typeof ACTIONS.REPLACE_NOTIFICATION_BY_ID;
  notification: NotificationItem;
  id: number | string;
}

export interface RemoveNotificationByIdAction {
  type: typeof ACTIONS.REMOVE_NOTIFICATION_BY_ID;
  id: number | string;
}

export interface RemoveCurrentNotificationAction {
  type: typeof ACTIONS.REMOVE_CURRENT_NOTIFICATION;
}

export interface ShowSimpleNotificationAction {
  type: typeof ACTIONS.SHOW_SIMPLE_NOTIFICATION;
  id?: number | string;
  autodismiss?: AutodismissValue;
  title?: string;
  description?: string;
  status?: string;
}

export interface ShowTransactionNotificationAction {
  type: typeof ACTIONS.SHOW_TRANSACTION_NOTIFICATION;
  autodismiss?: AutodismissValue;
  transaction: TransactionNotificationPayload['transaction'];
  status?: string;
}

export interface RemoveNotVisibleNotificationsAction {
  type: typeof ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS;
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
    type: ACTIONS.HIDE_CURRENT_NOTIFICATION,
  };
}

export function hideNotificationById(
  id: number | string,
): HideNotificationByIdAction {
  return {
    type: ACTIONS.HIDE_NOTIFICATION_BY_ID,
    id,
  };
}

export function modifyOrShowTransactionNotificationById({
  autodismiss,
  transaction,
  status,
}: TransactionNotificationPayload): ModifyOrShowTransactionNotificationAction {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
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
    type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

export function replaceNotificationById(
  notification: NotificationItem,
): ReplaceNotificationByIdAction {
  return {
    type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(
  id: number | string,
): RemoveNotificationByIdAction {
  return {
    type: ACTIONS.REMOVE_NOTIFICATION_BY_ID,
    id,
  };
}

export function removeCurrentNotification(): RemoveCurrentNotificationAction {
  return {
    type: ACTIONS.REMOVE_CURRENT_NOTIFICATION,
  };
}

export function showSimpleNotification({
  autodismiss,
  title,
  description,
  status,
  id,
}: SimpleNotificationPayload): ShowSimpleNotificationAction {
  return {
    id,
    type: ACTIONS.SHOW_SIMPLE_NOTIFICATION,
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
    type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function removeNotVisibleNotifications(): RemoveNotVisibleNotificationsAction {
  return {
    type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  };
}
