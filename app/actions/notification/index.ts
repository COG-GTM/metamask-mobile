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

export type NotificationId = string | number | undefined;

/** Transaction attached to a transaction notification; only `id` is read by the reducer. */
export interface NotificationTransaction {
  id?: NotificationId;
  [key: string]: unknown;
}

/** Arbitrary notification object stored in the queue (e.g. via replaceNotificationById). */
export interface NotificationLike {
  id?: NotificationId;
  [key: string]: unknown;
}

export type HideCurrentNotificationAction =
  ReduxAction<ActionType.HIDE_CURRENT_NOTIFICATION>;

export interface HideNotificationByIdAction
  extends ReduxAction<ActionType.HIDE_NOTIFICATION_BY_ID> {
  id: NotificationId;
}

export interface ModifyOrShowTransactionNotificationAction
  extends ReduxAction<ActionType.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION> {
  autodismiss?: number;
  transaction: NotificationTransaction;
  status?: string;
  id?: NotificationId;
}

export interface ModifyOrShowSimpleNotificationAction
  extends ReduxAction<ActionType.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION> {
  autodismiss?: number;
  title?: string;
  description?: string;
  status?: string;
  id?: NotificationId;
}

export interface ReplaceNotificationByIdAction
  extends ReduxAction<ActionType.REPLACE_NOTIFICATION_BY_ID> {
  notification: NotificationLike;
  id: NotificationId;
}

export interface RemoveNotificationByIdAction
  extends ReduxAction<ActionType.REMOVE_NOTIFICATION_BY_ID> {
  id: NotificationId;
}

export type RemoveCurrentNotificationAction =
  ReduxAction<ActionType.REMOVE_CURRENT_NOTIFICATION>;

export interface ShowSimpleNotificationAction
  extends ReduxAction<ActionType.SHOW_SIMPLE_NOTIFICATION> {
  id: NotificationId;
  autodismiss?: number;
  title?: string;
  description?: string;
  status?: string;
}

export interface ShowTransactionNotificationAction
  extends ReduxAction<ActionType.SHOW_TRANSACTION_NOTIFICATION> {
  autodismiss?: number;
  transaction: NotificationTransaction;
  status?: string;
}

export type RemoveNotVisibleNotificationsAction =
  ReduxAction<ActionType.REMOVE_NOT_VISIBLE_NOTIFICATIONS>;

export type Action =
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
    type: ActionType.HIDE_CURRENT_NOTIFICATION,
  };
}

export function hideNotificationById(
  id: NotificationId,
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
  autodismiss?: number;
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
  autodismiss?: number;
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
  notification: NotificationLike,
): ReplaceNotificationByIdAction {
  return {
    type: ActionType.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(
  id: NotificationId,
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
  autodismiss?: number;
  title?: string;
  description?: string;
  status?: string;
  id?: NotificationId;
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
  autodismiss?: number;
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
