import {
  TokenBalancesController,
  TokenBalancesControllerMessenger,
} from '@metamask/assets-controllers';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the TokenBalancesController.
 *
 * @param request - The request object.
 * @returns The TokenBalancesController.
 */
export const tokenBalancesControllerInit: ControllerInitFunction<
  TokenBalancesController,
  TokenBalancesControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const tokenBalancesController = new TokenBalancesController({
    messenger: controllerMessenger,
    // TODO: This is long, can we decrease it?
    interval: 180000,
    state: persistedState.TokenBalancesController,
  });

  return { controller: tokenBalancesController };
};
