import {



  defaultState } from
'@metamask/notification-services-controller/push-services';

import Logger from '../../../../util/Logger';
import { createNotificationServicesPushController } from './create-notification-services-push-controller';

const logControllerCreation = (
initialState) =>
{
  if (!initialState) {
    Logger.log(
      'Creating NotificationServicesPushController with default state',
      {
        defaultState
      }
    );
  } else {
    Logger.log(
      'Creating NotificationServicesPushController with initial state'
    );
  }
};

export const notificationServicesPushControllerInit =


(request) => {
  const { controllerMessenger, persistedState } = request;

  const initialState = persistedState.NotificationServicesPushController;
  logControllerCreation(initialState);

  const state =
  persistedState.NotificationServicesPushController ?? defaultState;

  const controller = createNotificationServicesPushController({
    messenger: controllerMessenger,
    initialState: state
  });

  return { controller };
};