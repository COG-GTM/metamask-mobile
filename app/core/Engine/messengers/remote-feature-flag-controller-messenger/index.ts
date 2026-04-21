import type { RemoteFeatureFlagControllerMessenger } from '@metamask/remote-feature-flag-controller';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the RemoteFeatureFlagControllerMessenger for the RemoteFeatureFlagController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The RemoteFeatureFlagControllerMessenger.
 */
export function getRemoteFeatureFlagControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): RemoteFeatureFlagControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'RemoteFeatureFlagController',
    allowedActions: [],
    allowedEvents: [],
  });
}
