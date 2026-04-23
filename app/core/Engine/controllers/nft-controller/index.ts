import {
  NftController,
  type NftControllerMessenger,
  type NftControllerState,
} from '@metamask/assets-controllers';
import type { ControllerInitFunction } from '../../types';
import { getGlobalChainId } from '../../../../util/networks/global-network';

/**
 * Initialize the NftController.
 *
 * @param request - The request object.
 * @returns The NftController.
 */
export const nftControllerInit: ControllerInitFunction<
  NftController,
  NftControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState, getController } = request;

  const networkController = getController('NetworkController');

  const controller = new NftController({
    chainId: getGlobalChainId(networkController),
    useIpfsSubdomains: false,
    messenger: controllerMessenger,
    state: persistedState.NftController as NftControllerState,
  });

  return { controller };
};
