import { NetworkController, NetworkControllerMessenger } from '@metamask/network-controller';
import { ChainId } from '@metamask/controller-utils';
import type { ControllerInitFunction } from '../../types';

const NON_EMPTY = 'NON_EMPTY';

/**
 * Initialize the NetworkController.
 *
 * @param request - The request object.
 * @returns The NetworkController.
 */
export const networkControllerInit: ControllerInitFunction<
  NetworkController,
  NetworkControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new NetworkController({
    infuraProjectId: process.env.MM_INFURA_PROJECT_ID || NON_EMPTY,
    state: persistedState.NetworkController,
    messenger: controllerMessenger,
    getRpcServiceOptions: () => ({
      fetch,
      btoa,
    }),
    additionalDefaultNetworks: [ChainId['megaeth-testnet']],
  });

  controller.initializeProvider();

  return { controller };
};
