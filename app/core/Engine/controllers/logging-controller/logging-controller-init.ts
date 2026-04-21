import { LoggingController } from '@metamask/logging-controller';

import type { ControllerInitFunction } from '../../types';
import type { LoggingControllerMessenger } from '../../messengers/logging-controller-messenger';

export const loggingControllerInit: ControllerInitFunction<
  LoggingController,
  LoggingControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new LoggingController({
    messenger: controllerMessenger,
    state: persistedState.LoggingController,
  });

  return { controller };
};
