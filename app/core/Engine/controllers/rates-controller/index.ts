import { RatesController, type RatesControllerMessenger } from '@metamask/assets-controllers';
import Logger from '../../../../util/Logger';
import { setupCurrencyRateSync } from '../RatesController/subscriptions';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the RatesController.
 *
 * @param request - The request object.
 * @returns The RatesController.
 */
export const ratesControllerInit: ControllerInitFunction<
  RatesController,
  RatesControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  try {
    const controller = new RatesController({
      messenger: controllerMessenger,
      state: persistedState.RatesController ?? {},
      includeUsdRate: true,
    });

    setupCurrencyRateSync(controllerMessenger, controller);

    return { controller };
  } catch (error) {
    Logger.error(error as Error, 'Failed to initialize RatesController');
    throw error;
  }
};
