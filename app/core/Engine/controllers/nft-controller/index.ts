import { NftController } from '@metamask/assets-controllers';
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

  const networkController = request.getController('NetworkController');

  const controller = new NftController({
    chainId: getGlobalChainId(networkController),
    useIpfsSubdomains: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messenger: controllerMessenger as any,
    state: persistedState.NftController,
  });

  return { controller };
};
