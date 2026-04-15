import notifee, {

  AuthorizationStatus,

  EventType } from



'@notifee/react-native';
import { Linking, Alert as NativeAlert, Platform } from 'react-native';
import { strings } from '../../../../locales/i18n';
import { store } from '../../../store';
import Logger from '../../../util/Logger';
import {
  ChannelId,
  notificationChannels } from
'../../../util/notifications/androidChannels';
import { withTimeout } from '../methods';
import { mmStorage } from '../settings';
import { STORAGE_IDS } from '../settings/storage/constants';
import { LAUNCH_ACTIVITY, PressActionId } from '../types';






class NotificationsService {
  async getBlockedNotifications() {
    try {
      const settings = await notifee.getNotificationSettings();
      const isNotAuthorised =
      settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED ||
      settings.authorizationStatus === AuthorizationStatus.DENIED;

      const channels = isNotAuthorised ?
      notificationChannels :
      await notifee.getChannels();

      const deniedChannelMap = new Map();
      channels.forEach((c) => {
        // default channels
        if (isNotAuthorised) {
          deniedChannelMap.set(c.id, true);
          return;
        }
        // known notifee channels
        if ('blocked' in c && c.blocked) {
          deniedChannelMap.set(c.id, true);
        }
      });

      return deniedChannelMap;
    } catch (e) {
      Logger.error(
        e,
        strings('notifications.error_checking_permission')
      );
      return new Map();
    }
  }

  async getAllPermissions(shouldOpenSettings = true) {
    const promises = notificationChannels.map(
      async (channel) =>
      await withTimeout(this.createChannel(channel), 5000)
    );
    await Promise.allSettled(promises);
    const permission = await withTimeout(
      this.requestPermission(),
      5000
    );

    const blockedNotifications = await withTimeout(
      this.getBlockedNotifications(),
      5000
    );
    if (
    (permission !== 'authorized' || blockedNotifications.size !== 0) &&
    shouldOpenSettings)
    {
      await this.requestPushNotificationsPermission();
    }
    return { permission, blockedNotifications };
  }

  async isDeviceNotificationEnabled() {
    const permission = await notifee.getNotificationSettings();

    const isAuthorized =
    permission.authorizationStatus === AuthorizationStatus.AUTHORIZED;

    store.dispatch({
      type: 'TOGGLE_DEVICE_NOTIFICATIONS',
      deviceNotificationEnabled: isAuthorized
    });
    return isAuthorized;
  }

  defaultButtons = (resolve) => [
  {
    text: strings('notifications.prompt_cancel'),
    onPress: () => {
      const promptCount = mmStorage.getLocal(
        STORAGE_IDS.PUSH_NOTIFICATIONS_PROMPT_COUNT
      );
      mmStorage.saveLocal(
        STORAGE_IDS.PUSH_NOTIFICATIONS_PROMPT_COUNT,
        promptCount + 1
      );
      mmStorage.saveLocal(
        STORAGE_IDS.PUSH_NOTIFICATIONS_PROMPT_TIME,
        Date.now().toString()
      );

      resolve(false);
    }
  },
  {
    text: strings('notifications.prompt_ok'),
    onPress: async () => {
      this.openSystemSettings();
      resolve(true);
    }
  }];


  asyncAlert = (
  title,
  msg,
  getButtons = this.
  defaultButtons) =>

  new Promise((resolve) => {
    NativeAlert.alert(title, msg, getButtons(resolve), {
      cancelable: false
    });
  });

  async requestPushNotificationsPermission() {
    try {
      await this.asyncAlert(
        strings('notifications.prompt_title'),
        strings('notifications.prompt_desc')
      );
    } catch (e) {
      Logger.error(
        e,
        strings('notifications.error_checking_permission')
      );
    }
  }
  openSystemSettings() {
    if (Platform.OS === 'ios') {
      Linking.openSettings();
    } else {
      notifee.openNotificationSettings();
    }
  }

  async requestPermission() {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL ?
    'authorized' :
    'denied';
  }

  onForegroundEvent = (
  observer) =>
  notifee.onForegroundEvent(observer);

  onBackgroundEvent = (observer) =>
  notifee.onBackgroundEvent(observer);

  incrementBadgeCount = async (incrementBy) => {
    notifee.incrementBadgeCount(incrementBy);
  };

  decrementBadgeCount = async (decrementBy) => {
    notifee.decrementBadgeCount(decrementBy);
  };

  setBadgeCount = async (count) => {
    notifee.setBadgeCount(count);
  };

  getBadgeCount = async () => notifee.getBadgeCount();

  handleNotificationPress = async ({
    detail,
    callback



  }) => {
    this.decrementBadgeCount(1);
    if (detail?.notification?.id) {
      await this.cancelTriggerNotification(detail.notification.id);
    }

    if (detail?.notification) {
      callback?.(detail.notification);
    }
  };

  handleNotificationEvent = async ({
    type,
    detail,
    callback


  }) => {
    switch (type) {
      case EventType.DELIVERED:
        this.incrementBadgeCount(1);
        break;
      case EventType.PRESS:
        this.handleNotificationPress({
          detail,
          callback
        });
        break;
    }
  };

  cancelTriggerNotification = async (id) => {
    if (!id) return;
    await notifee.cancelTriggerNotification(id);
  };

  getInitialNotification = async () =>
  await notifee.getInitialNotification();

  cancelAllNotifications = async () => {
    await notifee.cancelAllNotifications();
  };

  createChannel = async (channel) =>
  notifee.createChannel(channel);

  displayNotification = async ({
    channelId = ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
    pressActionId = PressActionId.OPEN_HOME,
    title,
    body,
    data,
    id







  }) => {
    await notifee.displayNotification({
      id,
      title,
      body,
      // Notifee can only store and handle data strings
      data: { dataStr: JSON.stringify(data) },
      android: {
        smallIcon: 'ic_notification_small',
        largeIcon: 'ic_notification',
        channelId: channelId ?? ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
        pressAction: {
          id: pressActionId,
          launchActivity: LAUNCH_ACTIVITY
        },
        tag: id
      },
      ios: {
        launchImageName: 'Default',
        sound: 'default',
        interruptionLevel: 'critical',
        foregroundPresentationOptions: {
          alert: true,
          sound: true,
          badge: true,
          banner: true,
          list: true
        }
      }
    });
  };
}

const NotificationService = new NotificationsService();

export default NotificationService;

export async function requestPushPermissions() {
  const result = await NotificationService.getAllPermissions(true);
  return result.permission === 'authorized';
}

export async function hasPushPermission() {
  const result = await NotificationService.getAllPermissions(false);
  return result.permission === 'authorized';
}