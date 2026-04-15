import {



  defaultState } from
'@metamask/notification-services-controller/notification-services';

import Logger from '../../../../util/Logger';
import { createNotificationServicesController } from './create-notification-services-controller';

const logControllerCreation = (
initialState) =>
{
  if (!initialState) {
    Logger.log('Creating NotificationServicesController with default state', {
      defaultState
    });
  } else {
    Logger.log('Creating NotificationServicesController with initial state');
  }
};

export const notificationServicesControllerInit =


(request) => {
  const { controllerMessenger, persistedState } = request;

  const initialState = persistedState.NotificationServicesController;
  logControllerCreation(initialState);

  const state = persistedState.NotificationServicesController ?? defaultState;

  const controller = createNotificationServicesController({
    messenger: controllerMessenger,
    initialState: state
  });

  return { controller };
};