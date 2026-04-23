import {
  TokenListController,
  type TokenListControllerMessenger,
} from '@metamask/assets-controllers';
import type { ControllerInitFunction } from '../../types';

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

  const controller = new TokenListController({
    chainId: getGlobalChainId(),
    messenger: controllerMessenger,
  });

  return { controller };
};
