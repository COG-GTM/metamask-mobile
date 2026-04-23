import {
  TokenListController,
  type TokenListControllerMessenger,
} from '@metamask/assets-controllers';
import type { ControllerInitFunction } from '../../types';
import AppConstants from '../../../AppConstants';

/**
 * Initialize the TokenListController.
 *
 * @param request - The request object.
 * @returns The TokenListController.
 */
export const tokenListControllerInit: ControllerInitFunction<
  TokenListController,
  TokenListControllerMessenger
> = (request) => {
  const { controllerMessenger, getGlobalChainId } = request;

  const networkController = request.getController('NetworkController');

  const controller = new TokenListController({
    chainId: getGlobalChainId(),
    onNetworkStateChange: (listener) =>
      controllerMessenger.subscribe(
        AppConstants.NETWORK_STATE_CHANGE_EVENT as 'NetworkController:stateChange',
        listener,
      ),
    messenger: controllerMessenger,
  });

  return { controller };
};
