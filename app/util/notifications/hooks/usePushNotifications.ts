import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  assertIsFeatureEnabled,
  disablePushNotifications as disablePushNotificationsHelper,
  enablePushNotifications as enablePushNotificationsHelper,
} from '../../../actions/notification/helpers';
import {
  selectIsMetaMaskPushNotificationsEnabled,
  selectIsMetaMaskPushNotificationsLoading,
} from '../../../selectors/notifications';
import {
  hasPushPermission,
  requestPushPermissions,
} from '../services/NotificationService';
import Logger from '../../Logger';

export type PushNotificationsEnableResult =
  | 'success'
  | 'permission-denied'
  | 'enable-failed';

export type PushNotificationsDisableResult = 'success' | 'disable-failed';

export type PushNotificationsToggleResult =
  | PushNotificationsEnableResult
  | PushNotificationsDisableResult;

export interface UsePushNotificationsToggleProps {
  // Depending on the instance, we may want to nudge to enable push notifications
  // Or skip nudging.
  // E.g. Onboarding = nudge, settings page = don't nudge
  nudgeEnablePush: boolean;
}
export function usePushNotificationsToggle(
  props: UsePushNotificationsToggleProps = { nudgeEnablePush: true },
) {
  const data = useSelector(selectIsMetaMaskPushNotificationsEnabled);
  const loading = useSelector(selectIsMetaMaskPushNotificationsLoading);

  const enablePushNotifications =
    useCallback(async (): Promise<PushNotificationsEnableResult> => {
      assertIsFeatureEnabled();
      const pushPermCallback = props.nudgeEnablePush
        ? requestPushPermissions
        : hasPushPermission;

      const hasPermission = await pushPermCallback().catch((e) => {
        Logger.error(e, 'Failed to request push notification permissions');
        return false;
      });
      if (!hasPermission) {
        return 'permission-denied';
      }

      try {
        await enablePushNotificationsHelper();
        return 'success';
      } catch (e) {
        Logger.error(e as Error, 'Failed to enable push notifications');
        return 'enable-failed';
      }
    }, [props.nudgeEnablePush]);

  const disablePushNotifications =
    useCallback(async (): Promise<PushNotificationsDisableResult> => {
      assertIsFeatureEnabled();
      try {
        await disablePushNotificationsHelper();
        return 'success';
      } catch (e) {
        Logger.error(e as Error, 'Failed to disable push notifications');
        return 'disable-failed';
      }
    }, []);

  const togglePushNotification = useCallback(
    async (val: boolean): Promise<PushNotificationsToggleResult> =>
      val ? await enablePushNotifications() : await disablePushNotifications(),
    [disablePushNotifications, enablePushNotifications],
  );

  return {
    data,
    togglePushNotification,
    loading,
  };
}
