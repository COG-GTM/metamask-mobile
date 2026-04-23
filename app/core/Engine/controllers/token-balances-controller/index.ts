import { TokenBalancesController } from '@metamask/assets-controllers';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';

/**
 * Initialize the TokenBalancesController.
 *
 * @param request - The request object.
 * @returns The TokenBalancesController.
 */
export const tokenBalancesControllerInit: ControllerInitFunction<
  TokenBalancesController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new TokenBalancesController({
    messenger: controllerMessenger,
    interval: 180000,
    state: persistedState.TokenBalancesController,
  });

  return { controller };
};
