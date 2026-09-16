/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import { ACTIONS } from '../../reducers/notification';

export interface SimpleNotificationParams {
  autodismiss?: number | boolean;
  title: string;
  description: string;
  status: string;
}

export interface TransactionNotificationParams {
  autodismiss?: number | boolean;
  transaction: { id: string; [key: string]: unknown };
  status: string;
}

export function hideCurrentNotification() {
  return {
    type: ACTIONS.HIDE_CURRENT_NOTIFICATION,
  };
}

export function hideNotificationById(id: string | number) {
  return {
    type: ACTIONS.HIDE_NOTIFICATION_BY_ID,
    id,
  };
}

export function modifyOrShowTransactionNotificationById({
  autodismiss,
  transaction,
  status,
}: TransactionNotificationParams) {
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
}: SimpleNotificationParams) {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
    autodismiss,
    title,
    description,
    status,
  };
}

export function replaceNotificationById(notification: {
  id: string | number;
  [key: string]: unknown;
}) {
  return {
    type: ACTIONS.REPLACE_NOTIFICATION_BY_ID,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(id: string | number) {
  return {
    type: ACTIONS.REMOVE_NOTIFICATION_BY_ID,
    id,
  };
}

export function removeCurrentNotification() {
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
}: SimpleNotificationParams & { id: string | number }) {
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
}: TransactionNotificationParams) {
  return {
    type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION,
    autodismiss,
    transaction,
    status,
  };
}

export function removeNotVisibleNotifications() {
  return {
    type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  };
}
