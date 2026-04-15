import { createSelector } from 'reselect';
import {

  TRIGGER_TYPES,
  defaultState as notificationControllerServiceDefaultState } from

'@metamask/notification-services-controller/notification-services';
import {

  defaultState as pushControllerDefaultState } from
'@metamask/notification-services-controller/push-services';

import { createDeepEqualSelector } from '../util';




const selectNotificationServicesControllerState = (state) =>
state?.engine?.backgroundState?.NotificationServicesController ??
notificationControllerServiceDefaultState;

const selectNotificationServicesPushControllerState = (state) =>
state?.engine?.backgroundState?.NotificationServicesPushController ??
pushControllerDefaultState;

export const selectIsMetamaskNotificationsEnabled = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  notificationServicesControllerState.isNotificationServicesEnabled
);
export const selectIsMetaMaskPushNotificationsEnabled = createSelector(
  selectNotificationServicesPushControllerState,
  (state) =>
  Boolean(state.isPushEnabled)
);
export const selectIsMetaMaskPushNotificationsLoading = createSelector(
  selectNotificationServicesPushControllerState,
  (state) => state.isUpdatingFCMToken
);

export const selectIsMetamaskNotificationsFeatureSeen = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  notificationServicesControllerState.isMetamaskNotificationsFeatureSeen
);
export const selectIsUpdatingMetamaskNotifications = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  notificationServicesControllerState.isUpdatingMetamaskNotifications
);
export const selectIsFetchingMetamaskNotifications = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  notificationServicesControllerState.isFetchingMetamaskNotifications
);
export const selectIsFeatureAnnouncementsEnabled = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  notificationServicesControllerState.isFeatureAnnouncementsEnabled
);
export const selectIsUpdatingMetamaskNotificationsAccount = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  notificationServicesControllerState.isUpdatingMetamaskNotificationsAccount
);
export const selectIsCheckingAccountsPresence = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  notificationServicesControllerState.isCheckingAccountsPresence
);
export const getmetamaskNotificationsReadList = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  notificationServicesControllerState.metamaskNotificationsReadList
);
export const getNotificationsList = createDeepEqualSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  notificationServicesControllerState.metamaskNotificationsList
);

export const getMetamaskNotificationsUnreadCount = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  (
  notificationServicesControllerState.metamaskNotificationsList ?? []).
  filter((notification) => !notification.isRead).length
);
export const getMetamaskNotificationsReadCount = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  (
  notificationServicesControllerState.metamaskNotificationsList ?? []).
  filter((notification) => notification.isRead).length
);
export const getOnChainMetamaskNotificationsUnreadCount = createSelector(
  selectNotificationServicesControllerState,
  (notificationServicesControllerState) =>
  (
  notificationServicesControllerState.metamaskNotificationsList ?? []).
  filter(
    (notification) =>
    !notification.isRead &&
    notification.type !== TRIGGER_TYPES.FEATURES_ANNOUNCEMENT
  ).length
);
export const getValidNotificationAccounts = createSelector(
  [selectNotificationServicesControllerState],
  (notificationServicesControllerState) =>
  notificationServicesControllerState.subscriptionAccountsSeen
);