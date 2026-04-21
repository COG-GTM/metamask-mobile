import { Messenger } from '@metamask/base-controller';
import type { BaseControllerMessenger } from '../../types';

export type PermissionControllerMessenger = ReturnType<
  typeof getPermissionControllerMessenger
>;

export type PermissionControllerInitMessenger = ReturnType<
  typeof getPermissionControllerInitMessenger
>;

/**
 * Get the restricted messenger for the PermissionController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The restricted messenger.
 */
export function getPermissionControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
) {
  return baseControllerMessenger.getRestricted({
    name: 'PermissionController',
    allowedActions: [
      `ApprovalController:addRequest`,
      `ApprovalController:hasRequest`,
      `ApprovalController:acceptRequest`,
      `ApprovalController:rejectRequest`,
      ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
      `SnapController:getPermitted`,
      `SnapController:install`,
      `SubjectMetadataController:getSubjectMetadata`,
      ///: END:ONLY_INCLUDE_IF
    ],
    allowedEvents: [],
  });
}

/**
 * Get the init messenger for the PermissionController. This has access to
 * the actions and events required to build the snap restricted methods and
 * caveat specifications used by the controller.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The init messenger.
 */
export function getPermissionControllerInitMessenger(
  baseControllerMessenger: Messenger<never, never>,
) {
  return baseControllerMessenger.getRestricted({
    name: 'PermissionControllerInit',
    allowedActions: [
      ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
      'ApprovalController:addRequest',
      'KeyringController:withKeyring',
      'PermissionController:hasPermission',
      'PhishingController:maybeUpdateState',
      'PhishingController:testOrigin',
      'SnapController:clearSnapState',
      'SnapController:get',
      'SnapController:getSnapState',
      'SnapController:handleRequest',
      'SnapController:updateSnapState',
      'SnapInterfaceController:createInterface',
      'SnapInterfaceController:getInterface',
      'SnapInterfaceController:updateInterface',
      ///: END:ONLY_INCLUDE_IF
    ],
    allowedEvents: [
      ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
      'KeyringController:unlock',
      ///: END:ONLY_INCLUDE_IF
    ],
  });
}
