import { PermissionController } from '@metamask/permission-controller';
import type {
  ControllerInitFunction,
  ControllerInitRequest,
} from '../../types';
import type {
  PermissionControllerMessenger,
  PermissionControllerInitMessenger,
} from '../../messengers/permission-controller-messenger';
import {
  getCaveatSpecifications,
  getPermissionSpecifications,
  unrestrictedMethods,
} from '../../../Permissions/specifications';
import { getSnapPermissionSpecifications } from './snap-permission-specs';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import Engine from '../..';
///: END:ONLY_INCLUDE_IF

export const permissionControllerInit: ControllerInitFunction<
  PermissionController<
    ReturnType<typeof getPermissionSpecifications> &
      ReturnType<typeof getSnapPermissionSpecifications>,
    ReturnType<typeof getCaveatSpecifications>
  >,
  PermissionControllerMessenger,
  PermissionControllerInitMessenger
> = (request) => {
  const { controllerMessenger, persistedState, initMessenger } = request;

  const controller = new PermissionController({
    messenger: controllerMessenger,
    state: persistedState.PermissionController,
    caveatSpecifications: getCaveatSpecifications({
      listAccounts: (...args) =>
        request.getController('AccountsController').listAccounts(...args),
      findNetworkClientIdByChainId: (...args) =>
        request
          .getController('NetworkController')
          .findNetworkClientIdByChainId(...args),
    }),
    permissionSpecifications: {
      ...getPermissionSpecifications(),
      ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
      ...getSnapPermissionSpecifications({
        getController: request.getController,
        initMessenger,
        ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
        getSnapKeyring: () => Engine.getSnapKeyring(),
        ///: END:ONLY_INCLUDE_IF
      }),
      ///: END:ONLY_INCLUDE_IF
    },
    unrestrictedMethods,
  });

  return { controller };
};

// Allow unused imports so the ControllerInitRequest reference keeps the
// generic type narrowing the messenger argument to PermissionControllerMessenger.
export type _PermissionControllerInitRequest = ControllerInitRequest<
  PermissionControllerMessenger,
  PermissionControllerInitMessenger
>;
