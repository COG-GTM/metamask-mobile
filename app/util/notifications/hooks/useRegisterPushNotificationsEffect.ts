import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { INotification } from '@metamask/notification-services-controller/notification-services';
import Engine from '../../../core/Engine';
import Routes from '../../../constants/navigation/Routes';
import NotificationsService from '../services/NotificationService';
import { PressActionId } from '../types';
import { useEffect } from 'react';
import { isNotificationsFeatureEnabled } from '../constants';
import { useSelector } from 'react-redux';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsMetaMaskPushNotificationsEnabled,
} from '../../../selectors/notifications';
import Logger from '../../Logger';
import MetaMetrics from '../../../core/Analytics/MetaMetrics';
import { MetaMetricsEvents } from '../../../core/Analytics/MetaMetrics.events';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';

type NavigationParams = Record<string, { notification: INotification }>;

const PUSH_NOTIFICATION_OPEN_CONTEXT = 'push_notification_open';

type PushNotificationOpenStage =
  | 'app_open_notification'
  | 'background_event'
  | 'app_open_effect'
  | 'background_effect';

type PushNotificationOpenFailureReason =
  | 'unparseable_payload'
  | 'invalid_payload_shape'
  | 'handler_error';

function isINotification(n: unknown): n is INotification {
  const assumedShape = n as INotification;
  return Boolean(assumedShape?.type) && Boolean(assumedShape?.data);
}

/**
 * Reports a push notification open failure to Sentry and MetaMetrics.
 * Notification payload contents are never included, only the failure shape.
 * @param error - error thrown while handling the notification open
 * @param stage - where in the open flow the failure occurred
 * @param reason - the kind of failure
 * @returns - void
 */
function reportPushNotificationOpenFailure(
  error: unknown,
  stage: PushNotificationOpenStage,
  reason: PushNotificationOpenFailureReason,
) {
  const e = error instanceof Error ? error : new Error(String(error));
  Logger.error(e, {
    context: PUSH_NOTIFICATION_OPEN_CONTEXT,
    stage,
    reason,
  });

  MetaMetrics.getInstance().trackEvent(
    MetricsEventBuilder.createEventBuilder(
      MetaMetricsEvents.PUSH_NOTIFICATION_OPEN_FAILED,
    )
      .addProperties({ stage, reason })
      .build(),
  );
}

/**
 * Logic for handling a push notification click.
 * It will publish an event, and attempt navigation to notifications view
 * @param notification - notification click received from App Start or Background
 * @param navigation - navigation prop for page navigations
 * @returns - void
 */
function clickPushNotification(
  notification: INotification,
  navigation: NavigationProp<NavigationParams>,
) {
  // Publish Click Event
  Engine.controllerMessenger.publish(
    'NotificationServicesPushController:pushNotificationClicked',
    notification,
  );

  // Navigate
  navigation.navigate(Routes.NOTIFICATIONS.DETAILS, {
    notification,
  });
}

/**
 * Parses a notification press payload and navigates, reporting failures.
 * @param notificationDataStr - stringified notification payload
 * @param pressActionId - press action of the notification press
 * @param navigation - navigation prop for page navigations
 * @param stage - where in the open flow this press was received
 * @returns - void
 */
function handleNotificationPress(
  notificationDataStr: string,
  pressActionId: string | undefined,
  navigation: NavigationProp<NavigationParams>,
  stage: PushNotificationOpenStage,
) {
  if (pressActionId !== PressActionId.OPEN_NOTIFICATIONS_VIEW) {
    return;
  }

  let notificationData: unknown;
  try {
    // Notify can only store strings
    notificationData = JSON.parse(notificationDataStr);
  } catch (e) {
    reportPushNotificationOpenFailure(e, stage, 'unparseable_payload');
    return;
  }

  if (!isINotification(notificationData)) {
    reportPushNotificationOpenFailure(
      new Error('Push notification payload is not a valid notification'),
      stage,
      'invalid_payload_shape',
    );
    return;
  }

  clickPushNotification(notificationData, navigation);
}

/**
 * Android Devices use a `getInitialNotifications` if a push notification cold-starts the application.
 * @param navigation - navigation prop for page navigations
 * @returns - void
 */
async function onAppOpenNotification(
  navigation: NavigationProp<NavigationParams>,
) {
  const initialNotification =
    await NotificationsService.getInitialNotification();
  if (!initialNotification) {
    return;
  }

  const { notification, pressAction } = initialNotification;
  const notificationDataStr = notification?.data?.dataStr;

  if (!notificationDataStr) {
    return;
  }

  handleNotificationPress(
    notificationDataStr as string,
    pressAction?.id,
    navigation,
    'app_open_notification',
  );
}

/**
 * IOS/Anroid devices will use a notifee `backgroundEvent` if a push notification is delivered and clicked on a minimised app.
 * (IOS also uses this for cold-starts).
 * @param navigation - navigation prop used for page navigations
 */
async function onBackgroundEvent(navigation: NavigationProp<NavigationParams>) {
  NotificationsService.onBackgroundEvent((event) =>
    NotificationsService.handleNotificationEvent({
      ...event,
      callback: (notification) => {
        const pressAction = event?.detail?.pressAction;
        const notificationDataStr = notification?.data?.dataStr;

        if (!notificationDataStr) {
          return;
        }

        handleNotificationPress(
          notificationDataStr as string,
          pressAction?.id,
          navigation,
          'background_event',
        );
      },
    }),
  );
}

/**
 * Effect that registers Notifee Push listeners
 * - When push notifications are recieved
 * - When push notifications are clicked
 */
export function useRegisterPushNotificationsEffect() {
  const navigation: NavigationProp<NavigationParams> = useNavigation();
  const notificationsFlagEnabled = isNotificationsFeatureEnabled();
  const notificationsControllerEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const notificationsPushControllerEnabled = useSelector(
    selectIsMetaMaskPushNotificationsEnabled,
  );
  const notificationsEnabled =
    notificationsFlagEnabled &&
    notificationsControllerEnabled &&
    notificationsPushControllerEnabled;

  // App Open Effect
  useEffect(() => {
    const run = async () => {
      try {
        if (notificationsEnabled) {
          await onAppOpenNotification(navigation);
        }
      } catch (e) {
        reportPushNotificationOpenFailure(
          e,
          'app_open_effect',
          'handler_error',
        );
      }
    };
    run();
  }, [navigation, notificationsEnabled]);

  // On Background and Foreground Events
  useEffect(() => {
    const run = async () => {
      try {
        if (notificationsEnabled) {
          await onBackgroundEvent(navigation);
        }
      } catch (e) {
        reportPushNotificationOpenFailure(
          e,
          'background_effect',
          'handler_error',
        );
      }
    };
    run();
  }, [navigation, notificationsEnabled]);
}
