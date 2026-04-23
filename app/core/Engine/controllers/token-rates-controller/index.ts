import { TokenRatesController, CodefiTokenPricesServiceV2 } from '@metamask/assets-controllers';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';

/**
 * Initialize the TokenRatesController.
 *
 * @param request - The request object.
 * @returns The TokenRatesController.
 */
export const tokenRatesControllerInit: ControllerInitFunction<
  TokenRatesController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new TokenRatesController({
    messenger: controllerMessenger,
    tokenPricesService: new CodefiTokenPricesServiceV2(),
    interval: 30 * 60 * 1000,
    state: persistedState.TokenRatesController || { marketData: {} },
  });

  return { controller };
};
