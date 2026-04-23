import { BaseControllerMessenger } from '../../types';

/**
 * Get the PermissionControllerMessenger for the PermissionController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The PermissionControllerMessenger.
 */
export function getPermissionControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
) {
  return baseControllerMessenger.getRestricted({
    name: 'PermissionController',
    allowedActions: [
      'ApprovalController:addRequest',
      'ApprovalController:hasRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
      'SnapController:getPermitted',
      'SnapController:install',
      'SubjectMetadataController:getSubjectMetadata',
      ///: END:ONLY_INCLUDE_IF
    ],
    allowedEvents: [],
  });
}
