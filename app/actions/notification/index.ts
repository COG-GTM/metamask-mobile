import { type Action } from 'redux';
/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import { NotificationActionType } from '../../reducers/notification';

export interface HideCurrentNotificationAction
  extends Action<typeof NotificationActionType.HIDE_CURRENT_NOTIFICATION> {}

export interface HideNotificationByIdAction
  extends Action<typeof NotificationActionType.HIDE_NOTIFICATION_BY_ID> {
  id: string;
}

export interface ModifyOrShowTransactionNotificationAction
  extends Action<typeof NotificationActionType.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION> {
  autodismiss: number;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
  status: string;
}

export interface ModifyOrShowSimpleNotificationAction
  extends Action<typeof NotificationActionType.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION> {
  autodismiss: number;
  title: string;
  description: string;
  status: string;
}

export interface ReplaceNotificationByIdAction
  extends Action<typeof NotificationActionType.REPLACE_NOTIFICATION_BY_ID> {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notification: any;
  id: string;
}

export interface RemoveNotificationByIdAction
  extends Action<typeof NotificationActionType.REMOVE_NOTIFICATION_BY_ID> {
  id: string;
}

export interface RemoveCurrentNotificationAction
  extends Action<typeof NotificationActionType.REMOVE_CURRENT_NOTIFICATION> {}

export interface ShowSimpleNotificationAction
  extends Action<typeof NotificationActionType.SHOW_SIMPLE_NOTIFICATION> {
  id: string;
  autodismiss: number;
  title: string;
  description: string;
  status: string;
}

export interface ShowTransactionNotificationAction
  extends Action<typeof NotificationActionType.SHOW_TRANSACTION_NOTIFICATION> {
  autodismiss: number;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
  status: string;
}

export interface RemoveNotVisibleNotificationsAction
  extends Action<typeof NotificationActionType.REMOVE_NOT_VISIBLE_NOTIFICATIONS> {}

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
  | ShowSimpleNotificationAction
  | ShowTransactionNotificationAction
  | RemoveNotVisibleNotificationsAction;

export function hideCurrentNotification(): HideCurrentNotificationAction {
  return {
    type: NotificationActionType.HIDE_CURRENT_NOTIFICATION,
  };
}

export function hideNotificationById(id: string): HideNotificationByIdAction {
  return {
    type: NotificationActionType.HIDE_NOTIFICATION_BY_ID,
    id,
  };
}

export function modifyOrShowTransactionNotificationById({
  autodismiss,
  transaction,
  status,
}: {
  autodismiss: number;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
  status: string;
}): ModifyOrShowTransactionNotificationAction {
  return {
    type: NotificationActionType.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
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
  autodismiss: number;
  title: string;
  description: string;
  status: string;
}): ModifyOrShowSimpleNotificationAction {
  return {
    type: NotificationActionType.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function replaceNotificationById(notification: any): ReplaceNotificationByIdAction {
  return {
    type: NotificationActionType.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(id: string): RemoveNotificationByIdAction {
  return {
    type: NotificationActionType.REMOVE_NOTIFICATION_BY_ID,
    id,
  };
}

export function removeCurrentNotification(): RemoveCurrentNotificationAction {
  return {
    type: NotificationActionType.REMOVE_CURRENT_NOTIFICATION,
  };
}

export function showSimpleNotification({
  autodismiss,
  title,
  description,
  status,
  id,
}: {
  autodismiss: number;
  title: string;
  description: string;
  status: string;
  id: string;
}): ShowSimpleNotificationAction {
  return {
    id,
    type: NotificationActionType.SHOW_SIMPLE_NOTIFICATION,
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
  autodismiss: number;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
  status: string;
}): ShowTransactionNotificationAction {
  return {
    type: NotificationActionType.SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function removeNotVisibleNotifications(): RemoveNotVisibleNotificationsAction {
  return {
    type: NotificationActionType.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  };
}
