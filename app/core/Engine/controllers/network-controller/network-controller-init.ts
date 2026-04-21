import {
  NetworkController,
  type NetworkControllerMessenger,
} from '@metamask/network-controller';
import { ChainId } from '@metamask/controller-utils';

import Logger from '../../../../util/Logger';
import type { ControllerInitFunction } from '../../types';

const NON_EMPTY = 'NON_EMPTY';

export const networkControllerInit: ControllerInitFunction<
  NetworkController,
  NetworkControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  try {
    const networkControllerOpts = {
      infuraProjectId: process.env.MM_INFURA_PROJECT_ID || NON_EMPTY,
      state: persistedState.NetworkController,
      messenger: controllerMessenger,
      getRpcServiceOptions: () => ({
        fetch,
        btoa,
      }),
      additionalDefaultNetworks: [ChainId['megaeth-testnet']],
    };
    const networkController = new NetworkController(networkControllerOpts);

    networkController.initializeProvider();

    return { controller: networkController };
  } catch (error) {
    Logger.error(error as Error, 'Failed to initialize NetworkController');
    throw error;
  }
};
