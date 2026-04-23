import { BaseControllerMessenger, BaseRestrictedControllerMessenger } from '../../types';

/**
 * Get the ApprovalControllerMessenger for the ApprovalController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The ApprovalControllerMessenger.
 */
export function getApprovalControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): BaseRestrictedControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'ApprovalController',
    allowedEvents: [],
    allowedActions: [],
  });
}
