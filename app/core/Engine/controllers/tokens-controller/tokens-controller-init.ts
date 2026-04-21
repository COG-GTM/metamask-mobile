import {
  TokensController,
  TokensControllerMessenger,
} from '@metamask/assets-controllers';
import type {
  ControllerInitFunction,
  ControllerInitRequest,
} from '../../types';

/**
 * Initialize the TokensController.
 *
 * @param request - The request object.
 * @returns The TokensController.
 */
export const tokensControllerInit: ControllerInitFunction<
  TokensController,
  TokensControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState, getGlobalChainId } = request;
  const { networkController } = getControllers(request);

  const tokensController = new TokensController({
    chainId: getGlobalChainId(),
    // @ts-expect-error at this point in time the provider will be defined by the `networkController.initializeProvider`
    provider: networkController.getProviderAndBlockTracker().provider,
    state: persistedState.TokensController,
    messenger: controllerMessenger,
  });

  return { controller: tokensController };
};

function getControllers(
  request: ControllerInitRequest<TokensControllerMessenger>,
) {
  return {
    networkController: request.getController('NetworkController'),
  };
}
