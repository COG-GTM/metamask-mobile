import { PermissionController } from '@metamask/permission-controller';
import {
  getCaveatSpecifications,
  getPermissionSpecifications,
  unrestrictedMethods,
} from '../../../Permissions/specifications.js';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
} from '@metamask/snaps-rpc-methods';
import { ExcludedSnapEndowments, ExcludedSnapPermissions } from '../../../Snaps';
///: END:ONLY_INCLUDE_IF
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the PermissionController.
 *
 * @param request - The request object.
 * @returns The PermissionController.
 */
export const permissionControllerInit: ControllerInitFunction<
  // TODO: Fix permission types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PermissionController<any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const accountsController = request.getController('AccountsController');
  const networkController = request.getController('NetworkController');

  const controller = new PermissionController({
    messenger: controllerMessenger,
    state: persistedState.PermissionController,
    caveatSpecifications: getCaveatSpecifications({
      listAccounts: (...args: Parameters<typeof accountsController.listAccounts>) =>
        accountsController.listAccounts(...args),
      findNetworkClientIdByChainId:
        networkController.findNetworkClientIdByChainId.bind(networkController),
    }),
    permissionSpecifications: {
      ...getPermissionSpecifications(),
      ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
      ...getSnapPermissionSpecifications(),
      ///: END:ONLY_INCLUDE_IF
    },
    unrestrictedMethods,
  });

  return { controller };
};

///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
function getSnapPermissionSpecifications() {
  return {
    ...buildSnapEndowmentSpecifications(Object.keys(ExcludedSnapEndowments)),
    ...buildSnapRestrictedMethodSpecifications(
      Object.keys(ExcludedSnapPermissions),
      {},
    ),
  };
}
///: END:ONLY_INCLUDE_IF
