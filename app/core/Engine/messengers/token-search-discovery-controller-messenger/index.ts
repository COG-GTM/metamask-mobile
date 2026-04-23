import type { TokenSearchDiscoveryControllerMessenger } from '@metamask/token-search-discovery-controller';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the TokenSearchDiscoveryControllerMessenger for the TokenSearchDiscoveryController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The TokenSearchDiscoveryControllerMessenger.
 */
export function getTokenSearchDiscoveryControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): TokenSearchDiscoveryControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'TokenSearchDiscoveryController',
    allowedActions: [],
    allowedEvents: [],
  });
}
