import { BaseControllerMessenger, BaseRestrictedControllerMessenger } from '../../types';

/**
 * Get the NetworkControllerMessenger for the NetworkController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The NetworkControllerMessenger.
 */
export function getNetworkControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): BaseRestrictedControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'NetworkController',
    allowedEvents: [],
    allowedActions: [],
  });
}
