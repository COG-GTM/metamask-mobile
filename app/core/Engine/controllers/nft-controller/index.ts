import { NftController } from '@metamask/assets-controllers';
import type { NetworkController } from '@metamask/network-controller';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';
import { getGlobalChainId } from '../../../../util/networks/global-network';

/**
 * Initialize the NftController.
 *
 * @param request - The request object.
 * @returns The NftController.
 */
export const nftControllerInit: ControllerInitFunction<
  NftController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const networkController = request.getController('NetworkController') as NetworkController;

  const controller = new NftController({
    chainId: getGlobalChainId(networkController),
    useIpfsSubdomains: false,
    messenger: controllerMessenger,
    state: persistedState.NftController,
  });

  return { controller };
};
