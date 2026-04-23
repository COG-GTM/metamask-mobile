import { AssetsContractController } from '@metamask/assets-controllers';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';
import { getGlobalChainId } from '../../../../util/networks/global-network';

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
  const { controllerMessenger, getGlobalChainId: getChainId } = request;

  const networkController = request.getController('NetworkController');

  const controller = new AssetsContractController({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messenger: controllerMessenger as any,
    chainId: getGlobalChainId(networkController),
  });

  return { controller };
};
