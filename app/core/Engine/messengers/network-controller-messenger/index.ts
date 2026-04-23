import { NetworkControllerMessenger } from '@metamask/network-controller';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the NetworkControllerMessenger for the NetworkController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The NetworkControllerMessenger.
 */
export function getNetworkControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): NetworkControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'NetworkController',
    allowedActions: [],
    allowedEvents: [],
  }) as unknown as NetworkControllerMessenger;
}
