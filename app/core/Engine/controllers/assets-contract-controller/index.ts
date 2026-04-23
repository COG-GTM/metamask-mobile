import { AssetsContractController } from '@metamask/assets-controllers';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';
import { getGlobalChainId } from '../../../../util/networks/global-network';
import type { NetworkController } from '@metamask/network-controller';

/**
 * Initialize the AssetsContractController.
 *
 * @param request - The request object.
 * @returns The AssetsContractController.
 */
export const assetsContractControllerInit: ControllerInitFunction<
  AssetsContractController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger } = request;

  const networkController = request.getController('NetworkController') as NetworkController;

  const controller = new AssetsContractController({
    messenger: controllerMessenger,
    chainId: getGlobalChainId(networkController),
  });

  return { controller };
};
