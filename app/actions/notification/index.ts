/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import type { Action as ReduxAction } from 'redux';

export enum ActionType {
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

export interface NotificationTransaction {
  id: string | number;
}

export interface NotificationItem {
  id: string | number;
  isVisible?: boolean;
  autodismiss?: number | boolean | null;
  title?: string;
  description?: string;
  status?: string;
  type?: string;
  transaction?: NotificationTransaction;
}

export interface HideCurrentNotificationAction
  extends ReduxAction<ActionType.HIDE_CURRENT_NOTIFICATION> {}

export interface HideNotificationByIdAction
  extends ReduxAction<ActionType.HIDE_NOTIFICATION_BY_ID> {
  id: string | number;
}

export interface ModifyOrShowTransactionNotificationAction
  extends ReduxAction<ActionType.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION> {
  autodismiss?: number | boolean | null;
  transaction: NotificationTransaction;
  status?: string;
}

export interface ModifyOrShowSimpleNotificationAction
  extends ReduxAction<ActionType.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION> {
  autodismiss?: number | boolean | null;
  title?: string;
  description?: string;
  status?: string;
}

export interface ReplaceNotificationByIdAction
  extends ReduxAction<ActionType.REPLACE_NOTIFICATION_BY_ID> {
  notification: NotificationItem;
  id: string | number;
}

export interface RemoveNotificationByIdAction
  extends ReduxAction<ActionType.REMOVE_NOTIFICATION_BY_ID> {
  id: string | number;
}

export interface RemoveCurrentNotificationAction
  extends ReduxAction<ActionType.REMOVE_CURRENT_NOTIFICATION> {}

export interface RemoveNotVisibleNotificationsAction
  extends ReduxAction<ActionType.REMOVE_NOT_VISIBLE_NOTIFICATIONS> {}

export interface ShowSimpleNotificationAction
  extends ReduxAction<ActionType.SHOW_SIMPLE_NOTIFICATION> {
  id?: string | number;
  autodismiss?: number | boolean | null;
  title?: string;
  description?: string;
  status?: string;
}

export interface ShowTransactionNotificationAction
  extends ReduxAction<ActionType.SHOW_TRANSACTION_NOTIFICATION> {
  autodismiss?: number | boolean | null;
  transaction: NotificationTransaction;
  status?: string;
}

export type Action =
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

export function hideCurrentNotification(): HideCurrentNotificationAction {
  return {
    type: ActionType.HIDE_CURRENT_NOTIFICATION,
  };
}

export function hideNotificationById(
  id: string | number,
): HideNotificationByIdAction {
  return {
    type: ActionType.HIDE_NOTIFICATION_BY_ID,
    id,
  };
}

export function modifyOrShowTransactionNotificationById({
  autodismiss,
  transaction,
  status,
}: {
  autodismiss?: number | boolean | null;
  transaction: NotificationTransaction;
  status?: string;
}): ModifyOrShowTransactionNotificationAction {
  return {
    type: ActionType.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
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
  autodismiss?: number | boolean | null;
  title?: string;
  description?: string;
  status?: string;
}): ModifyOrShowSimpleNotificationAction {
  return {
    type: ActionType.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
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
    type: ActionType.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(
  id: string | number,
): RemoveNotificationByIdAction {
  return {
    type: ActionType.REMOVE_NOTIFICATION_BY_ID,
    id,
  };
}

export function removeCurrentNotification(): RemoveCurrentNotificationAction {
  return {
    type: ActionType.REMOVE_CURRENT_NOTIFICATION,
  };
}

export function showSimpleNotification({
  autodismiss,
  title,
  description,
  status,
  id,
}: {
  autodismiss?: number | boolean | null;
  title?: string;
  description?: string;
  status?: string;
  id?: string | number;
}): ShowSimpleNotificationAction {
  return {
    id,
    type: ActionType.SHOW_SIMPLE_NOTIFICATION,
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
  autodismiss?: number | boolean | null;
  transaction: NotificationTransaction;
  status?: string;
}): ShowTransactionNotificationAction {
  return {
    type: ActionType.SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function removeNotVisibleNotifications(): RemoveNotVisibleNotificationsAction {
  return {
    type: ActionType.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  };
}
