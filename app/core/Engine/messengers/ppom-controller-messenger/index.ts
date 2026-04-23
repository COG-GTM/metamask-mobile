import { BaseControllerMessenger } from '../../types';

/**
 * Get the PPOMControllerMessenger for the PPOMController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The PPOMControllerMessenger.
 */
export function getPPOMControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
) {
  return baseControllerMessenger.getRestricted({
    name: 'PPOMController',
    allowedActions: ['NetworkController:getNetworkClientById'],
    allowedEvents: ['NetworkController:networkDidChange'],
  });
}
