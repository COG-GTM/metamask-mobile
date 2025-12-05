/* eslint-disable @typescript-eslint/default-param-last */
import { createSelector } from 'reselect';
import {
  NotificationTypes,
  NotificationTypesType,
} from '../../util/notifications';

const { TRANSACTION, SIMPLE } = NotificationTypes;

export interface BaseNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  status: string;
  type: NotificationTypesType;
}

export interface SimpleNotification extends BaseNotification {
  type: typeof SIMPLE;
  title: string;
  description: string;
}

export interface TransactionNotification extends BaseNotification {
  type: typeof TRANSACTION;
  transaction: {
    id: string;
    [key: string]: unknown;
  };
}

export type Notification = SimpleNotification | TransactionNotification;

export interface NotificationState {
  notifications: Notification[];
}

export const initialState: NotificationState = {
  notifications: [],
};

export const ACTIONS = {
  HIDE_CURRENT_NOTIFICATION: 'HIDE_CURRENT_NOTIFICATION',
  HIDE_NOTIFICATION_BY_ID: 'HIDE_NOTIFICATION_BY_ID',
  MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION:
    'MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION',
  MODIFY_OR_SHOW_SIMPLE_NOTIFICATION: 'MODIFY_OR_SHOW_SIMPLE_NOTIFICATION',
  REPLACE_NOTIFICATION_BY_ID: 'REPLACE_NOTIFICATION_BY_ID',
  REMOVE_NOTIFICATION_BY_ID: 'REMOVE_NOTIFICATION_BY_ID',
  REMOVE_CURRENT_NOTIFICATION: 'REMOVE_CURRENT_NOTIFICATION',
  REMOVE_NOT_VISIBLE_NOTIFICATIONS: 'REMOVE_NOT_VISIBLE_NOTIFICATIONS',
  SHOW_SIMPLE_NOTIFICATION: 'SHOW_SIMPLE_NOTIFICATION',
  SHOW_TRANSACTION_NOTIFICATION: 'SHOW_TRANSACTION_NOTIFICATION',
  UPDATE_NOTIFICATION_STATUS: 'UPDATE_NOTIFICATION_STATUS',
} as const;

export type ActionTypes = (typeof ACTIONS)[keyof typeof ACTIONS];

interface HideCurrentNotificationAction {
  type: typeof ACTIONS.HIDE_CURRENT_NOTIFICATION;
}

interface HideNotificationByIdAction {
  type: typeof ACTIONS.HIDE_NOTIFICATION_BY_ID;
  id: string;
}

interface ModifyOrShowTransactionNotificationAction {
  type: typeof ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION;
  id?: string;
  autodismiss?: number;
  transaction: { id: string; [key: string]: unknown };
  status: string;
}

interface ModifyOrShowSimpleNotificationAction {
  type: typeof ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION;
  id?: string;
  autodismiss?: number;
  title: string;
  description: string;
  status: string;
}

interface ReplaceNotificationByIdAction {
  type: typeof ACTIONS.REPLACE_NOTIFICATION_BY_ID;
  id: string;
  notification: Notification;
}

interface RemoveNotificationByIdAction {
  type: typeof ACTIONS.REMOVE_NOTIFICATION_BY_ID;
  id: string;
}

interface RemoveCurrentNotificationAction {
  type: typeof ACTIONS.REMOVE_CURRENT_NOTIFICATION;
}

interface ShowSimpleNotificationAction {
  type: typeof ACTIONS.SHOW_SIMPLE_NOTIFICATION;
  id: string;
  autodismiss?: number;
  title: string;
  description: string;
  status: string;
}

interface ShowTransactionNotificationAction {
  type: typeof ACTIONS.SHOW_TRANSACTION_NOTIFICATION;
  autodismiss?: number;
  transaction: { id: string; [key: string]: unknown };
  status: string;
}

interface RemoveNotVisibleNotificationsAction {
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

const enqueue = (
  notifications: Notification[],
  notification: Notification,
): Notification[] => [...notifications, notification];

const dequeue = (notifications: Notification[]): Notification[] =>
  notifications.slice(1);

export const currentNotificationSelector = createSelector(
  (state: NotificationState) => state?.notifications,
  (notifications: Notification[] | undefined) => notifications?.[0] || {},
);

const notificationReducer = (
  state: NotificationState = initialState,
  action: NotificationAction | { type: null },
): NotificationState => {
  const { notifications } = state;
  switch (action.type) {
    case ACTIONS.HIDE_CURRENT_NOTIFICATION: {
      if (notifications[0]) {
        return {
          ...state,
          notifications: [
            { ...notifications[0], isVisible: false },
            ...notifications.slice(1),
          ],
        };
      }
      return state;
    }
    case ACTIONS.HIDE_NOTIFICATION_BY_ID: {
      const index = notifications.findIndex(({ id }) => id === action.id);
      if (index === -1) {
        return state;
      }
      return {
        ...state,
        notifications: [
          ...notifications.slice(0, index),
          { ...notifications[index], isVisible: false },
          ...notifications.slice(index + 1),
        ],
      };
    }
    case ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION: {
      const index = notifications.findIndex(({ id }) => id === action.id);
      if (index >= 0) {
        return {
          ...state,
          notifications: [
            ...notifications.slice(0, index),
            {
              ...notifications[index],
              ...{
                id: action.transaction.id,
                isVisible: true,
                autodismiss: action.autodismiss ?? 5000,
                transaction: action.transaction,
                status: action.status,
                type: TRANSACTION,
              },
            },
            ...notifications.slice(index + 1),
          ],
        };
      }
      return {
        ...state,
        notifications: enqueue(notifications, {
          id: action.transaction.id,
          isVisible: true,
          autodismiss: action.autodismiss ?? 5000,
          transaction: action.transaction,
          status: action.status,
          type: TRANSACTION,
        }),
      };
    }
    case ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION: {
      const index = notifications.findIndex(({ id }) => id === action.id);
      if (index >= 0) {
        return {
          ...state,
          notifications: [
            ...notifications.slice(0, index),
            {
              ...notifications[index],
              ...{
                id: action.id as string,
                isVisible: true,
                autodismiss: action.autodismiss ?? 5000,
                title: action.title,
                description: action.description,
                status: action.status,
                type: SIMPLE,
              },
            },
            ...notifications.slice(index + 1),
          ],
        };
      }
      return {
        ...state,
        notifications: enqueue(notifications, {
          id: action.id as string,
          isVisible: true,
          autodismiss: action.autodismiss ?? 5000,
          title: action.title,
          description: action.description,
          status: action.status,
          type: SIMPLE,
        }),
      };
    }
    case ACTIONS.REPLACE_NOTIFICATION_BY_ID: {
      const index = notifications.findIndex(({ id }) => id === action.id);
      if (index === -1) {
        return state;
      }
      return {
        ...state,
        notifications: [
          ...notifications.slice(0, index),
          action.notification,
          ...notifications.slice(index + 1),
        ],
      };
    }
    case ACTIONS.REMOVE_NOTIFICATION_BY_ID: {
      return {
        ...state,
        notifications: notifications.filter(({ id }) => id !== action.id),
      };
    }
    case ACTIONS.REMOVE_CURRENT_NOTIFICATION: {
      return {
        ...state,
        notifications: dequeue(notifications),
      };
    }
    case ACTIONS.SHOW_SIMPLE_NOTIFICATION: {
      return {
        ...state,
        notifications: enqueue(notifications, {
          id: action.id,
          isVisible: true,
          autodismiss: action.autodismiss || 5000,
          title: action.title,
          description: action.description,
          status: action.status,
          type: SIMPLE,
        }),
      };
    }
    case ACTIONS.SHOW_TRANSACTION_NOTIFICATION: {
      return {
        ...state,
        notifications: enqueue(notifications, {
          id: action.transaction.id,
          isVisible: true,
          autodismiss: action.autodismiss || 5000,
          transaction: action.transaction,
          status: action.status,
          type: TRANSACTION,
        }),
      };
    }
    case ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS: {
      const visibleNotifications =
        notifications?.filter((notification) => notification.isVisible) || [];
      return {
        ...state,
        notifications: visibleNotifications,
      };
    }
    default:
      return state;
  }
};

export default notificationReducer;
