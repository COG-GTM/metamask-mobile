import { TokenSearchDiscoveryDataControllerMessenger } from '@metamask/assets-controllers';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the TokenSearchDiscoveryDataControllerMessenger for the TokenSearchDiscoveryDataController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The TokenSearchDiscoveryDataControllerMessenger.
 */
export function getTokenSearchDiscoveryDataControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): TokenSearchDiscoveryDataControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'TokenSearchDiscoveryDataController',
    allowedActions: ['CurrencyRateController:getState'],
    allowedEvents: [],
  });
}
