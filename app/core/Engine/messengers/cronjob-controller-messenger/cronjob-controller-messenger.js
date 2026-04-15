

import {
  SnapControllerHandleRequestAction,
  SnapControllerSnapDisabledEvent,
  SnapControllerSnapEnabledEvent,
  SnapControllerSnapInstalledEvent,
  SnapControllerSnapUninstalledEvent,
  SnapControllerSnapUpdatedEvent,
  SnapControllerGetAllSnapsAction } from
'../../controllers/snaps';

/**
 * Get the CronjobControllerMessenger for the CronjobController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The CronjobControllerMessenger.
 */
export function getCronjobControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'CronjobController',
    allowedEvents: [
    SnapControllerSnapInstalledEvent,
    SnapControllerSnapUpdatedEvent,
    SnapControllerSnapUninstalledEvent,
    SnapControllerSnapEnabledEvent,
    SnapControllerSnapDisabledEvent],

    allowedActions: [
    `PermissionController:getPermissions`,
    SnapControllerHandleRequestAction,
    SnapControllerGetAllSnapsAction]

  });
}