import { ApprovalControllerMessenger } from '@metamask/approval-controller';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the ApprovalControllerMessenger for the ApprovalController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The ApprovalControllerMessenger.
 */
export function getApprovalControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): ApprovalControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'ApprovalController',
    allowedEvents: [],
    allowedActions: [],
  });
}
