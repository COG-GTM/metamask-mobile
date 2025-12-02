import { createSelector } from 'reselect';
import { NotificationTypes } from '../../util/notifications';
import { Action } from 'redux';
import { RootState } from '..';

const { TRANSACTION, SIMPLE } = NotificationTypes;

export interface TransactionNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  transaction: {
    id: string;
    [key: string]: unknown;
  };
  status: string;
  type: typeof TRANSACTION;
}

export interface SimpleNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  title: string;
  description: string;
  status: string;
  type: typeof SIMPLE;
}

export type Notification = TransactionNotification | SimpleNotification;

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

interface HideCurrentNotificationAction
  extends Action<typeof ACTIONS.HIDE_CURRENT_NOTIFICATION> {}

interface HideNotificationByIdAction
  extends Action<typeof ACTIONS.HIDE_NOTIFICATION_BY_ID> {
  id: string;
}

interface ModifyOrShowTransactionNotificationAction
  extends Action<typeof ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION> {
  id: string;
  transaction: { id: string; [key: string]: unknown };
  autodismiss: number;
  status: string;
}

interface ModifyOrShowSimpleNotificationAction
  extends Action<typeof ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION> {
  id: string;
  autodismiss: number;
  title: string;
  description: string;
  status: string;
}

interface ReplaceNotificationByIdAction
  extends Action<typeof ACTIONS.REPLACE_NOTIFICATION_BY_ID> {
  id: string;
  notification: Notification;
}

interface RemoveNotificationByIdAction
  extends Action<typeof ACTIONS.REMOVE_NOTIFICATION_BY_ID> {
  id: string;
}

interface RemoveCurrentNotificationAction
  extends Action<typeof ACTIONS.REMOVE_CURRENT_NOTIFICATION> {}

interface RemoveNotVisibleNotificationsAction
  extends Action<typeof ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS> {}

interface ShowSimpleNotificationAction
  extends Action<typeof ACTIONS.SHOW_SIMPLE_NOTIFICATION> {
  id: string;
  autodismiss?: number;
  title: string;
  description: string;
  status: string;
}

interface ShowTransactionNotificationAction
  extends Action<typeof ACTIONS.SHOW_TRANSACTION_NOTIFICATION> {
  transaction: { id: string; [key: string]: unknown };
  autodismiss?: number;
  status: string;
}

type NotificationAction =
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

const enqueue = (
  notifications: Notification[],
  notification: Notification,
): Notification[] => [...notifications, notification];

const dequeue = (notifications: Notification[]): Notification[] =>
  notifications.slice(1);

export const currentNotificationSelector = createSelector(
  (state: RootState) => state?.notification?.notifications,
  (notifications: Notification[] | undefined) => notifications?.[0] || {},
);

const notificationReducer = (
  state: NotificationState = initialState,
  action: NotificationAction,
): NotificationState => {
  const { notifications } = state;
  switch (action.type) {
    // make current notification isVisible props false
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
                autodismiss: action.autodismiss,
                transaction: action.transaction,
                status: action.status,
                type: TRANSACTION,
              },
            },
            ...notifications.slice(index + 1),
          ] as Notification[],
        };
      }
      return {
        ...state,
        notifications: enqueue(notifications, {
          id: action.transaction.id,
          isVisible: true,
          autodismiss: action.autodismiss,
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
                id: action.id,
                isVisible: true,
                autodismiss: action.autodismiss,
                title: action.title,
                description: action.description,
                status: action.status,
                type: SIMPLE,
              },
            },
            ...notifications.slice(index + 1),
          ] as Notification[],
        };
      }
      return {
        ...state,
        notifications: enqueue(notifications, {
          id: action.id,
          isVisible: true,
          autodismiss: action.autodismiss,
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
