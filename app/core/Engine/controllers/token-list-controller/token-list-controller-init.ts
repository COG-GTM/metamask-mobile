import {
  TokenListController,
  type TokenListControllerMessenger,
} from '@metamask/assets-controllers';

import type { ControllerInitFunction } from '../../types';
import AppConstants from '../../../AppConstants';

export const tokenListControllerInit: ControllerInitFunction<
  TokenListController,
  TokenListControllerMessenger
> = (request) => {
  const { controllerMessenger, getGlobalChainId } = request;

  const controller = new TokenListController({
    chainId: getGlobalChainId(),
    onNetworkStateChange: (listener) =>
      controllerMessenger.subscribe(
        AppConstants.NETWORK_STATE_CHANGE_EVENT,
        listener,
      ),
    messenger: controllerMessenger,
  });

  return { controller };
};
