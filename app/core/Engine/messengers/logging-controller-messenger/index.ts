import type { LoggingControllerMessenger } from '@metamask/logging-controller';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the LoggingControllerMessenger for the LoggingController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The LoggingControllerMessenger.
 */
export function getLoggingControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): LoggingControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'LoggingController',
    allowedActions: [],
    allowedEvents: [],
  });
}
