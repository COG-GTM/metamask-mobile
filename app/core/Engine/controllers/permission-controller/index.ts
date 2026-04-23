import { PermissionController } from '@metamask/permission-controller';
import {
  getCaveatSpecifications,
  getPermissionSpecifications,
  unrestrictedMethods,
} from '../../../Permissions/specifications.js';
import type { ControllerInitFunction } from '../../types';

/**
 * Snap permission specifications provider.
 * Set by Engine.ts before controller initialization since building snap specs
 * requires access to the Engine's controllerMessenger and instance methods.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let snapPermissionSpecificationsProvider: (() => Record<string, any>) | null =
  null;

/**
 * Set the snap permission specifications provider function.
 * Must be called before permissionControllerInit.
 *
 * @param provider - Function that returns snap permission specifications.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setSnapPermissionSpecificationsProvider(
  provider: () => Record<string, any>,
) {
  snapPermissionSpecificationsProvider = provider;
}

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
      ...(snapPermissionSpecificationsProvider
        ? snapPermissionSpecificationsProvider()
        : {}),
    },
    unrestrictedMethods,
  });

  return { controller };
};
