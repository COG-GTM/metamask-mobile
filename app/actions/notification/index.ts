/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import type { Action } from 'redux';
import { ACTIONS } from '../../reducers/notification';

export interface TransactionNotificationData {
  id?: string;
  status?: string;
  [key: string]: unknown;
}

export interface SimpleNotification {
  id?: string;
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
}

export interface NotificationItem {
  id: string;
  type?: string;
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
  transaction?: TransactionNotificationData;
}

export type HideCurrentNotificationAction = Action<
  typeof ACTIONS.HIDE_CURRENT_NOTIFICATION
>;

export interface HideNotificationByIdAction
  extends Action<typeof ACTIONS.HIDE_NOTIFICATION_BY_ID> {
  id: string;
}

export interface ModifyOrShowTransactionNotificationAction
  extends Action<typeof ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION> {
  autodismiss?: number | boolean;
  transaction: TransactionNotificationData;
  status?: string;
}

export interface ModifyOrShowSimpleNotificationAction
  extends Action<typeof ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION> {
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
}

export interface ReplaceNotificationByIdAction
  extends Action<typeof ACTIONS.REPLACE_NOTIFICATION_BY_ID> {
  notification: NotificationItem;
  id: string;
}

export interface RemoveNotificationByIdAction
  extends Action<typeof ACTIONS.REMOVE_NOTIFICATION_BY_ID> {
  id: string;
}

export type RemoveCurrentNotificationAction = Action<
  typeof ACTIONS.REMOVE_CURRENT_NOTIFICATION
>;

export interface ShowSimpleNotificationAction
  extends Action<typeof ACTIONS.SHOW_SIMPLE_NOTIFICATION> {
  id?: string;
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
}

export interface ShowTransactionNotificationAction
  extends Action<typeof ACTIONS.SHOW_TRANSACTION_NOTIFICATION> {
  autodismiss?: number | boolean;
  transaction: TransactionNotificationData;
  status?: string;
}

export type RemoveNotVisibleNotificationsAction = Action<
  typeof ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS
>;

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
  id: string,
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
}: {
  autodismiss?: number | boolean;
  transaction: TransactionNotificationData;
  status?: string;
}): ModifyOrShowTransactionNotificationAction {
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
}: {
  autodismiss?: number | boolean;
  title?: string;
  description?: string;
  status?: string;
}): ModifyOrShowSimpleNotificationAction {
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
  id: string,
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
}: SimpleNotification): ShowSimpleNotificationAction {
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
}: {
  autodismiss?: number | boolean;
  transaction: TransactionNotificationData;
  status?: string;
}): ShowTransactionNotificationAction {
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
