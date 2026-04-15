import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  assertIsFeatureEnabled,
  disablePushNotifications as disablePushNotificationsHelper,
  enablePushNotifications as enablePushNotificationsHelper } from
'../../../actions/notification/helpers';
import {
  selectIsMetaMaskPushNotificationsEnabled,
  selectIsMetaMaskPushNotificationsLoading } from
'../../../selectors/notifications';
import {
  hasPushPermission,
  requestPushPermissions } from
'../services/NotificationService';







export function usePushNotificationsToggle(
props = { nudgeEnablePush: true })
{
  const data = useSelector(selectIsMetaMaskPushNotificationsEnabled);
  const loading = useSelector(selectIsMetaMaskPushNotificationsLoading);

  const enablePushNotifications = useCallback(async () => {
    assertIsFeatureEnabled();
    const pushPermCallback = props.nudgeEnablePush ?
    requestPushPermissions :
    hasPushPermission;

    const result = await pushPermCallback().catch(() => false);
    if (!result) return;

    await enablePushNotificationsHelper().catch(() => {

      /* Do Nothing */});
  }, [props.nudgeEnablePush]);

  const disablePushNotifications = useCallback(async () => {
    assertIsFeatureEnabled();
    await disablePushNotificationsHelper().catch(() => {

      /* Do Nothing */});
  }, []);

  const togglePushNotification = useCallback(
    async (val) => {
      val ? await enablePushNotifications() : await disablePushNotifications();
    },
    [disablePushNotifications, enablePushNotifications]
  );

  return {
    data,
    togglePushNotification,
    loading
  };
}