import { createSelector } from 'reselect';
import {
  NotificationServicesControllerState,
  defaultState as notificationControllerServiceDefaultState,
  INotification,
} from '@metamask/notification-services-controller/notification-services';
import {
  NotificationServicesPushControllerState,
  defaultState as pushControllerDefaultState,
} from '@metamask/notification-services-controller/push-services';

import { createDeepEqualSelector } from '../util';
import { RootState } from '../../reducers';

type NotificationServicesState = NotificationServicesControllerState;

const selectNotificationServicesControllerState = (state: RootState) =>
  state?.engine?.backgroundState?.NotificationServicesController ??
  notificationControllerServiceDefaultState;

const selectNotificationServicesPushControllerState = (state: RootState) =>
  state?.engine?.backgroundState?.NotificationServicesPushController ??
  pushControllerDefaultState;

export const selectIsMetamaskNotificationsEnabled = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState: NotificationServicesState) =>
    notificationServicesControllerState.isNotificationServicesEnabled,
);
export const selectIsMetaMaskPushNotificationsEnabled = createSelector(
  selectNotificationServicesPushControllerState,
  (state: NotificationServicesPushControllerState) =>
    Boolean(state.isPushEnabled),
);
export const selectIsMetaMaskPushNotificationsLoading = createSelector(
  selectNotificationServicesPushControllerState,
  (state: NotificationServicesPushControllerState) => state.isUpdatingFCMToken,
);

export const selectIsUpdatingMetamaskNotifications = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState: NotificationServicesState) =>
    notificationServicesControllerState.isUpdatingMetamaskNotifications,
);
export const selectIsFetchingMetamaskNotifications = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState: NotificationServicesState) =>
    notificationServicesControllerState.isFetchingMetamaskNotifications,
);
export const selectIsFeatureAnnouncementsEnabled = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState: NotificationServicesState) =>
    notificationServicesControllerState.isFeatureAnnouncementsEnabled,
);
export const selectIsUpdatingMetamaskNotificationsAccount = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState: NotificationServicesState) =>
    notificationServicesControllerState.isUpdatingMetamaskNotificationsAccount,
);
export const getNotificationsList = createDeepEqualSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState: NotificationServicesState) =>
    notificationServicesControllerState.metamaskNotificationsList,
);

export const getMetamaskNotificationsUnreadCount = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState: NotificationServicesState) =>
    (
      notificationServicesControllerState.metamaskNotificationsList ?? []
    ).filter((notification: INotification) => !notification.isRead).length,
);
export const getMetamaskNotificationsReadCount = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState: NotificationServicesState) =>
    (
      notificationServicesControllerState.metamaskNotificationsList ?? []
    ).filter((notification: INotification) => notification.isRead).length,
);
export const getValidNotificationAccounts = createSelector(
  [selectNotificationServicesControllerState],
  (notificationServicesControllerState: NotificationServicesState) =>
    notificationServicesControllerState.subscriptionAccountsSeen,
);
