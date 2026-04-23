import {
  LoggingController,
  type LoggingControllerMessenger,
} from '@metamask/logging-controller';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the LoggingController.
 *
 * @param request - The request object.
 * @returns The LoggingController.
 */
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
