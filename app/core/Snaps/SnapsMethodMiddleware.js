///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import { createSnapsMethodMiddleware } from '@metamask/snaps-rpc-methods';
import {

  SubjectType } from
'@metamask/permission-controller';

import { RestrictedMethods } from '../Permissions/constants';
import { keyringSnapPermissionsBuilder } from '../SnapKeyring/keyringSnapsPermissions';


import { handleSnapRequest } from './utils';
import {
  CronjobControllerCancelBackgroundEventAction,
  CronjobControllerGetBackgroundEventsAction,
  SnapControllerClearSnapStateAction,
  SnapControllerGetPermittedSnapsAction,
  SnapControllerGetSnapAction,
  SnapControllerGetSnapFileAction,
  SnapControllerGetSnapStateAction,
  SnapControllerInstallSnapsAction,
  SnapControllerUpdateSnapStateAction,
  SnapInterfaceControllerCreateInterfaceAction,
  SnapInterfaceControllerResolveInterfaceAction,
  SnapInterfaceControllerUpdateInterfaceAction,
  SnapInterfaceControllerUpdateInterfaceStateAction } from
'../Engine/controllers/snaps';
import { KeyringTypes } from '@metamask/keyring-controller';

export function getSnapIdFromRequest(
request)
{
  const { snapId } = request;
  return typeof snapId === 'string' ? snapId : null;
}
// Snaps middleware
/*
    from extension https://github.dev/MetaMask/metamask-extension/blob/1d5e8a78400d7aaaf2b3cbdb30cff9399061df34/app/scripts/metamask-controller.js#L3830-L3861
    */
const snapMethodMiddlewareBuilder = (
engineContext,
controllerMessenger,
origin,
subjectType) =>

createSnapsMethodMiddleware(subjectType === SubjectType.Snap, {
  getUnlockPromise: () => {
    if (engineContext.KeyringController.isUnlocked()) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      controllerMessenger.subscribeOnceIf(
        'KeyringController:unlock',
        resolve,
        () => true
      );
    });
  },
  getSnaps: controllerMessenger.call.bind(
    controllerMessenger,
    SnapControllerGetPermittedSnapsAction,
    origin
  ),
  requestPermissions: async (requestedPermissions) =>
  await engineContext.PermissionController.requestPermissions(
    { origin },
    requestedPermissions
  ),
  getPermissions: engineContext.PermissionController.getPermissions.bind(
    engineContext.PermissionController,
    origin
  ),
  hasPermission: engineContext.PermissionController.hasPermission.bind(
    engineContext.PermissionController,
    origin
  ),
  getAllowedKeyringMethods: keyringSnapPermissionsBuilder(origin),
  getSnapFile: controllerMessenger.call.bind(
    controllerMessenger,
    SnapControllerGetSnapFileAction,
    origin
  ),
  installSnaps: controllerMessenger.call.bind(
    controllerMessenger,
    SnapControllerInstallSnapsAction,
    origin
  ),
  invokeSnap: engineContext.PermissionController.executeRestrictedMethod.bind(
    engineContext.PermissionController,
    origin,
    RestrictedMethods.wallet_snap
  ),
  createInterface: controllerMessenger.call.bind(
    controllerMessenger,
    SnapInterfaceControllerCreateInterfaceAction,
    origin
  ),
  updateInterface: controllerMessenger.call.bind(
    controllerMessenger,
    SnapInterfaceControllerUpdateInterfaceAction,
    origin
  ),
  getInterfaceContext: (id) =>
  controllerMessenger.call(
    'SnapInterfaceController:getInterface',
    origin,
    id
  ).context,
  getInterfaceState: (id) =>
  controllerMessenger.call(
    'SnapInterfaceController:getInterface',
    origin,
    id
  ).state,
  resolveInterface: controllerMessenger.call.bind(
    controllerMessenger,
    SnapInterfaceControllerResolveInterfaceAction,
    origin
  ),
  getSnap: controllerMessenger.call.bind(
    controllerMessenger,
    SnapControllerGetSnapAction
  ),
  updateInterfaceState: controllerMessenger.call.bind(
    controllerMessenger,
    SnapInterfaceControllerUpdateInterfaceStateAction,
    origin
  ),
  handleSnapRpcRequest: async (request) => {
    const snapId = getSnapIdFromRequest(request);

    if (!snapId) {
      throw new Error(
        'snapMethodMiddlewareBuilder handleSnapRpcRequest: Invalid snap request: snapId not found'
      );
    }

    return await handleSnapRequest(controllerMessenger, {
      snapId,
      origin,
      handler: request.handler,
      request: request.request
    });
  },
  requestUserApproval:
  engineContext.ApprovalController.addAndShowApprovalRequest.bind(
    engineContext.ApprovalController
  ),
  getIsLocked: () => !engineContext.KeyringController.isUnlocked(),
  getEntropySources: () => {
    const state = controllerMessenger.call('KeyringController:getState');

    return state.keyrings.
    map((keyring, index) => {
      if (keyring.type === KeyringTypes.hd) {
        return {
          id: state.keyringsMetadata[index].id,
          name: state.keyringsMetadata[index].name,
          type: 'mnemonic',
          primary: index === 0
        };
      }

      return null;
    }).
    filter(Boolean);
  },
  clearSnapState: controllerMessenger.call.bind(
    controllerMessenger,
    SnapControllerClearSnapStateAction,
    origin
  ),
  getSnapState: controllerMessenger.call.bind(
    controllerMessenger,
    SnapControllerGetSnapStateAction,
    origin
  ),
  updateSnapState: controllerMessenger.call.bind(
    controllerMessenger,
    SnapControllerUpdateSnapStateAction,
    origin
  ),
  scheduleBackgroundEvent: (
  event) =>

  controllerMessenger.call('CronjobController:scheduleBackgroundEvent', {
    ...event,
    snapId: origin
  }),
  cancelBackgroundEvent: controllerMessenger.call.bind(
    controllerMessenger,
    CronjobControllerCancelBackgroundEventAction,
    origin
  ),
  getBackgroundEvents: controllerMessenger.call.bind(
    controllerMessenger,
    CronjobControllerGetBackgroundEventsAction,
    origin
  ),
  getNetworkConfigurationByChainId: controllerMessenger.call.bind(
    controllerMessenger,
    'NetworkController:getNetworkConfigurationByChainId'
  ),
  getNetworkClientById: controllerMessenger.call.bind(
    controllerMessenger,
    'NetworkController:getNetworkClientById'
  )
});

export default snapMethodMiddlewareBuilder;
///: END:ONLY_INCLUDE_IF