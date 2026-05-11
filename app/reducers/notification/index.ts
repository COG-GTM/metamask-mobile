/* eslint-disable @typescript-eslint/default-param-last */
import { createSelector } from 'reselect';
import { NotificationTypes } from '../../util/notifications';

const { TRANSACTION, SIMPLE } = NotificationTypes;

export interface NotificationTransaction {
  id: string;
  [key: string]: unknown;
}

export interface NotificationItem {
  id?: string;
  isVisible: boolean;
  autodismiss?: number | null;
  title?: string;
  description?: string;
  status?: string;
  transaction?: NotificationTransaction;
  type: typeof TRANSACTION | typeof SIMPLE;
}

export interface NotificationReducerState {
  notifications: NotificationItem[];
}

export const initialState: NotificationReducerState = {
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

export type NotificationAction =
  | { type: typeof ACTIONS.HIDE_CURRENT_NOTIFICATION }
  | { type: typeof ACTIONS.HIDE_NOTIFICATION_BY_ID; id: string }
  | {
      type: typeof ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION;
      id?: string;
      transaction: NotificationTransaction;
      status?: string;
      autodismiss?: number | null;
    }
  | {
      type: typeof ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION;
      id: string;
      title?: string;
      description?: string;
      status?: string;
      autodismiss?: number | null;
    }
  | {
      type: typeof ACTIONS.REPLACE_NOTIFICATION_BY_ID;
      id: string;
      notification: NotificationItem;
    }
  | { type: typeof ACTIONS.REMOVE_NOTIFICATION_BY_ID; id: string }
  | { type: typeof ACTIONS.REMOVE_CURRENT_NOTIFICATION }
  | { type: typeof ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS }
  | {
      type: typeof ACTIONS.SHOW_SIMPLE_NOTIFICATION;
      id: string;
      title?: string;
      description?: string;
      status?: string;
      autodismiss?: number | null;
    }
  | {
      type: typeof ACTIONS.SHOW_TRANSACTION_NOTIFICATION;
      transaction: NotificationTransaction;
      status?: string;
      autodismiss?: number | null;
    }
  | { type: typeof ACTIONS.UPDATE_NOTIFICATION_STATUS };

const enqueue = (
  notifications: NotificationItem[],
  notification: NotificationItem,
): NotificationItem[] => [...notifications, notification];

const dequeue = (notifications: NotificationItem[]): NotificationItem[] =>
  notifications.slice(1);

export const currentNotificationSelector = createSelector(
  (state: NotificationReducerState | undefined) => state?.notifications ?? [],
  (notifications: NotificationItem[]) =>
    (notifications[0] ?? {}) as NotificationItem | Record<string, never>,
);

const notificationReducer = (
  state: NotificationReducerState = initialState,
  action: NotificationAction,
): NotificationReducerState => {
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
          ],
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
          ],
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
