/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import { ACTIONS } from '../../reducers/notification';

interface TransactionNotificationPayload {
  autodismiss: number;
  transaction: { id: string | number; [key: string]: unknown };
  status: string;
}

interface SimpleNotificationPayload {
  autodismiss: number;
  title: string;
  description: string;
  status: string;
}

interface SimpleNotificationWithIdPayload extends SimpleNotificationPayload {
  id: string | number;
}

interface NotificationObject {
  id: string | number;
  [key: string]: unknown;
}

export function hideCurrentNotification() {
  return {
    type: ACTIONS.HIDE_CURRENT_NOTIFICATION,
  } as const;
}

export function hideNotificationById(id: string | number) {
  return {
    type: ACTIONS.HIDE_NOTIFICATION_BY_ID,
    id,
  } as const;
}

export function modifyOrShowTransactionNotificationById({
  autodismiss,
  transaction,
  status,
}: TransactionNotificationPayload) {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  } as const;
}

export function modifyOrShowSimpleNotificationById({
  autodismiss,
  title,
  description,
  status,
}: SimpleNotificationPayload) {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  } as const;
}

export function replaceNotificationById(notification: NotificationObject) {
  return {
    type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  } as const;
}

export function removeNotificationById(id: string | number) {
  return {
    type: ACTIONS.REMOVE_NOTIFICATION_BY_ID,
    id,
  } as const;
}

export function removeCurrentNotification() {
  return {
    type: ACTIONS.REMOVE_CURRENT_NOTIFICATION,
  } as const;
}

export function showSimpleNotification({
  autodismiss,
  title,
  description,
  status,
  id,
}: SimpleNotificationWithIdPayload) {
  return {
    id,
    type: ACTIONS.SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  } as const;
}

export function showTransactionNotification({
  autodismiss,
  transaction,
  status,
}: TransactionNotificationPayload) {
  return {
    type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  } as const;
}

export function removeNotVisibleNotifications() {
  return {
    type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  } as const;
}
