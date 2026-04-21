import {
  NftController,
  NftControllerMessenger,
} from '@metamask/assets-controllers';
import type { ControllerInitFunction } from '../../types';

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
  const { controllerMessenger, persistedState, getGlobalChainId } = request;

  const nftController = new NftController({
    chainId: getGlobalChainId(),
    useIpfsSubdomains: false,
    messenger: controllerMessenger,
    state: persistedState.NftController,
  });

  if (process.env.MM_OPENSEA_KEY) {
    nftController.setApiKey(process.env.MM_OPENSEA_KEY);
  }

  return { controller: nftController };
};
