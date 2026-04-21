import {
  CodefiTokenPricesServiceV2,
  TokenRatesController,
  TokenRatesControllerMessenger,
} from '@metamask/assets-controllers';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the TokenRatesController.
 *
 * @param request - The request object.
 * @returns The TokenRatesController.
 */
export const tokenRatesControllerInit: ControllerInitFunction<
  TokenRatesController,
  TokenRatesControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const codefiTokenApiV2 = new CodefiTokenPricesServiceV2();

  const tokenRatesController = new TokenRatesController({
    messenger: controllerMessenger,
    tokenPricesService: codefiTokenApiV2,
    interval: 30 * 60 * 1000,
    state: persistedState.TokenRatesController || { marketData: {} },
  });

  return { controller: tokenRatesController };
};
