import {
  NetworkController,
  NetworkControllerMessenger,
} from '@metamask/network-controller';
import { ChainId } from '@metamask/controller-utils';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';

const NON_EMPTY = 'NON_EMPTY';

/**
 * Initialize the NetworkController.
 *
 * @param request - The request object.
 * @returns The NetworkController.
 */
export const networkControllerInit: ControllerInitFunction<
  NetworkController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const networkControllerOpts = {
    infuraProjectId: process.env.MM_INFURA_PROJECT_ID || NON_EMPTY,
    state: persistedState.NetworkController,
    messenger: controllerMessenger as unknown as NetworkControllerMessenger,
    getRpcServiceOptions: () => ({
      fetch,
      btoa,
    }),
    additionalDefaultNetworks: [ChainId['megaeth-testnet']],
  };
  const controller = new NetworkController(networkControllerOpts);

  controller.initializeProvider();

  return { controller };
};
