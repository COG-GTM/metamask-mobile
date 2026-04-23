import type { PhishingControllerMessenger } from '@metamask/phishing-controller';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the PhishingControllerMessenger for the PhishingController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The PhishingControllerMessenger.
 */
export function getPhishingControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): PhishingControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'PhishingController',
    allowedActions: [],
    allowedEvents: [],
  });
}
