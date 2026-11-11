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

type NavigationParams = Record<string, { notification: INotification }>;

function isINotification(n: unknown): n is INotification {
  const assumedShape = n as INotification;
  return Boolean(assumedShape?.type) && Boolean(assumedShape?.data);
}

/**
 * Notification click payloads are not trusted: on Android any app can deliver one via Notifee's receiver activity.
 * Only the id is read from the payload; the notification itself is loaded from controller state.
 * @param clickedNotification - parsed notification payload from the click event
 * @returns the matching notification from controller state, or undefined when there is no match
 */
async function getTrustedNotification(
  clickedNotification: unknown,
): Promise<INotification | undefined> {
  const id = (clickedNotification as { id?: unknown } | null)?.id;
  if (typeof id !== 'string' || !id) {
    return undefined;
  }

  const controller = Engine.context.NotificationServicesController;
  const findById = () =>
    controller.state.metamaskNotificationsList.find((n) => n.id === id);

  let notification = findById();
  if (!notification) {
    await controller.fetchAndUpdateMetamaskNotifications().catch(() => null);
    notification = findById();
  }

  return notification && isINotification(notification)
    ? notification
    : undefined;
}

/**
 * Handles a notification press: resolves the clicked notification from controller state and navigates to its details.
 * @param pressActionId - Notifee press action id of the click
 * @param notificationDataStr - serialized notification payload from the click
 * @param navigation - navigation prop for page navigations
 */
async function handleNotificationClick(
  pressActionId: string | undefined,
  notificationDataStr: unknown,
  navigation: NavigationProp<NavigationParams>,
) {
  if (pressActionId !== PressActionId.OPEN_NOTIFICATIONS_VIEW) {
    return;
  }

  // Notify can only store strings
  const clickedNotification = JSON.parse(notificationDataStr as string);
  const notification = await getTrustedNotification(clickedNotification);
  if (notification) {
    clickPushNotification(notification, navigation);
  }
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

  try {
    await handleNotificationClick(
      pressAction?.id,
      notificationDataStr,
      navigation,
    );
  } catch {
    // Do Nothing
  }
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
      callback: async (notification) => {
        const pressAction = event?.detail?.pressAction;
        const notificationDataStr = notification?.data?.dataStr;

        if (!notificationDataStr) {
          return;
        }

        try {
          await handleNotificationClick(
            pressAction?.id,
            notificationDataStr,
            navigation,
          );
        } catch {
          // Do Nothing
        }
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
      } catch {
        // Do Nothing
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
      } catch {
        // Do Nothing
      }
    };
    run();
  }, [navigation, notificationsEnabled]);
}
