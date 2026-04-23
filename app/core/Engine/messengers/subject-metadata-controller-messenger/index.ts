import type { SubjectMetadataControllerMessenger } from '@metamask/permission-controller';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the SubjectMetadataControllerMessenger for the SubjectMetadataController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The SubjectMetadataControllerMessenger.
 */
export function getSubjectMetadataControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): SubjectMetadataControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'SubjectMetadataController',
    allowedActions: ['PermissionController:hasPermissions'],
    allowedEvents: [],
  });
}
