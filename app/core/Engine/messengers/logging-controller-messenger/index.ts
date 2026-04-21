import type { RestrictedMessenger } from '@metamask/base-controller';
import { BaseControllerMessenger } from '../../types';

export type LoggingControllerMessenger = RestrictedMessenger<
  'LoggingController',
  never,
  never,
  never,
  never
>;

/**
 * Get the LoggingControllerMessenger for the LoggingController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The LoggingControllerMessenger.
 */
export function getLoggingControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): LoggingControllerMessenger {
  return baseControllerMessenger.getRestricted<
    'LoggingController',
    never,
    never
  >({
    name: 'LoggingController',
    allowedActions: [],
    allowedEvents: [],
  });
}
