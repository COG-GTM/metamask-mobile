import { TokensController } from '@metamask/assets-controllers';
import type { NetworkController } from '@metamask/network-controller';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';
import { getGlobalChainId } from '../../../../util/networks/global-network';

/**
 * Initialize the TokensController.
 *
 * @param request - The request object.
 * @returns The TokensController.
 */
export const tokensControllerInit: ControllerInitFunction<
  TokensController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const networkController = request.getController('NetworkController') as NetworkController;

  const controller = new TokensController({
    chainId: getGlobalChainId(networkController),
    // @ts-expect-error at this point in time the provider will be defined by the `networkController.initializeProvider`
    provider: networkController.getProviderAndBlockTracker().provider,
    state: persistedState.TokensController,
    messenger: controllerMessenger,
  });

  return { controller };
};
