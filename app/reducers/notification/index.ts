/* eslint-disable @typescript-eslint/default-param-last */
import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';
import { NotificationTypes } from '../../util/notifications';
import {
  ActionType,
  type HideCurrentNotificationAction,
  type HideNotificationByIdAction,
  type ModifyOrShowSimpleNotificationAction,
  type ModifyOrShowTransactionNotificationAction,
  type NotificationAutodismiss,
  type NotificationId,
  type NotificationLike,
  type NotificationTransaction,
  type RemoveCurrentNotificationAction,
  type RemoveNotificationByIdAction,
  type RemoveNotVisibleNotificationsAction,
  type ReplaceNotificationByIdAction,
  type ShowSimpleNotificationAction,
  type ShowTransactionNotificationAction,
} from '../../actions/notification';
const { TRANSACTION, SIMPLE } = NotificationTypes;

export interface NotificationItem extends NotificationLike {
  id?: NotificationId;
  isVisible?: boolean;
  autodismiss?: NotificationAutodismiss;
  status?: string;
  type?: string;
  title?: string;
  description?: string;
  transaction?: NotificationTransaction;
}

export interface NotificationState {
  notifications: NotificationItem[];
}

export const initialState: NotificationState = {
  notifications: [],
};

export const ACTIONS = {
  HIDE_CURRENT_NOTIFICATION: ActionType.HIDE_CURRENT_NOTIFICATION,
  HIDE_NOTIFICATION_BY_ID: ActionType.HIDE_NOTIFICATION_BY_ID,
  MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION:
    ActionType.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
  MODIFY_OR_SHOW_SIMPLE_NOTIFICATION:
    ActionType.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
  REPLACE_NOTIFICATION_BY_ID: ActionType.REPLACE_NOTIFICATION_BY_ID,
  REMOVE_NOTIFICATION_BY_ID: ActionType.REMOVE_NOTIFICATION_BY_ID,
  REMOVE_CURRENT_NOTIFICATION: ActionType.REMOVE_CURRENT_NOTIFICATION,
  REMOVE_NOT_VISIBLE_NOTIFICATIONS: ActionType.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
  SHOW_SIMPLE_NOTIFICATION: ActionType.SHOW_SIMPLE_NOTIFICATION,
  SHOW_TRANSACTION_NOTIFICATION: ActionType.SHOW_TRANSACTION_NOTIFICATION,
  UPDATE_NOTIFICATION_STATUS: ActionType.UPDATE_NOTIFICATION_STATUS,
};

export const currentNotificationSelector = createSelector(
  (state: NotificationState | undefined) => state?.notifications,
  (notifications) =>
    (notifications as NotificationItem[])[0] || ({} as NotificationItem),
);

/**
 * Finds a queued notification by id.
 *
 * @param notifications - The notification queue.
 * @param notificationId - The id to look up (strict equality).
 * @returns The index of the first match, or -1 when no entry matches.
 */
const findIndexById = (
  notifications: NotificationItem[],
  notificationId: NotificationId,
) => notifications.findIndex(({ id }) => id === notificationId);

/**
 * Returns a new queue with the entry at `index` replaced; the input is not modified.
 * Legacy case reducers always returned a new state object for these updates,
 * even when values were unchanged; callers observe that reference change.
 *
 * @param notifications - The notification queue.
 * @param index - Position of the entry to replace.
 * @param notification - The replacement entry.
 * @returns A new notification queue.
 */
const replaceAt = (
  notifications: NotificationItem[],
  index: number,
  notification: NotificationItem,
) => [
  ...notifications.slice(0, index),
  notification,
  ...notifications.slice(index + 1),
];

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // make current notification isVisible props false
      .addCase(
        ActionType.HIDE_CURRENT_NOTIFICATION,
        (state, _action: HideCurrentNotificationAction) => {
          const { notifications } = state;
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
        },
      )
      .addCase(
        ActionType.HIDE_NOTIFICATION_BY_ID,
        (state, action: HideNotificationByIdAction) => {
          const { notifications } = state;
          const index = findIndexById(notifications, action.id);
          if (index === -1) {
            return state;
          }
          return {
            ...state,
            notifications: replaceAt(notifications, index, {
              ...notifications[index],
              isVisible: false,
            }),
          };
        },
      )
      .addCase(
        ActionType.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION,
        (state, action: ModifyOrShowTransactionNotificationAction) => {
          const index = findIndexById(state.notifications, action.id);
          const notification: NotificationItem = {
            id: action.transaction.id,
            isVisible: true,
            autodismiss: action.autodismiss,
            transaction: action.transaction,
            status: action.status,
            type: TRANSACTION,
          };
          if (index >= 0) {
            return {
              ...state,
              notifications: replaceAt(state.notifications, index, {
                ...state.notifications[index],
                ...notification,
              }),
            };
          }
          state.notifications.push(notification);
        },
      )
      .addCase(
        ActionType.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION,
        (state, action: ModifyOrShowSimpleNotificationAction) => {
          const index = findIndexById(state.notifications, action.id);
          const notification: NotificationItem = {
            id: action.id,
            isVisible: true,
            autodismiss: action.autodismiss,
            title: action.title,
            description: action.description,
            status: action.status,
            type: SIMPLE,
          };
          if (index >= 0) {
            return {
              ...state,
              notifications: replaceAt(state.notifications, index, {
                ...state.notifications[index],
                ...notification,
              }),
            };
          }
          state.notifications.push(notification);
        },
      )
      .addCase(
        ActionType.REPLACE_NOTIFICATION_BY_ID,
        (state, action: ReplaceNotificationByIdAction) => {
          const index = findIndexById(state.notifications, action.id);
          if (index === -1) {
            return state;
          }
          return {
            ...state,
            notifications: replaceAt(
              state.notifications,
              index,
              action.notification,
            ),
          };
        },
      )
      .addCase(
        ActionType.REMOVE_NOTIFICATION_BY_ID,
        (state, action: RemoveNotificationByIdAction) => {
          state.notifications = state.notifications.filter(
            ({ id }) => id !== action.id,
          );
        },
      )
      .addCase(
        ActionType.REMOVE_CURRENT_NOTIFICATION,
        (state, _action: RemoveCurrentNotificationAction) => {
          state.notifications = state.notifications.slice(1);
        },
      )
      .addCase(
        ActionType.SHOW_SIMPLE_NOTIFICATION,
        (state, action: ShowSimpleNotificationAction) => {
          state.notifications.push({
            id: action.id,
            isVisible: true,
            autodismiss: action.autodismiss || 5000,
            title: action.title,
            description: action.description,
            status: action.status,
            type: SIMPLE,
          });
        },
      )
      .addCase(
        ActionType.SHOW_TRANSACTION_NOTIFICATION,
        (state, action: ShowTransactionNotificationAction) => {
          state.notifications.push({
            id: action.transaction.id,
            isVisible: true,
            autodismiss: action.autodismiss || 5000,
            transaction: action.transaction,
            status: action.status,
            type: TRANSACTION,
          });
        },
      )
      .addCase(
        ActionType.REMOVE_NOT_VISIBLE_NOTIFICATIONS,
        (state, _action: RemoveNotVisibleNotificationsAction) => {
          state.notifications =
            state.notifications?.filter(
              (notification) => notification.isVisible,
            ) || [];
        },
      );
  },
});

export default notificationSlice.reducer;
