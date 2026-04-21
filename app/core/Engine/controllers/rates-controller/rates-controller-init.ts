import {
  CurrencyRateController,
  CurrencyRateControllerEvents,
  CurrencyRateState,
  RatesController,
  RatesControllerMessenger,
} from '@metamask/assets-controllers';
import { RestrictedMessenger } from '@metamask/base-controller';
import Logger from '../../../../util/Logger';
import type { ControllerInitFunction } from '../../types';

// FIXME: This messenger type is not exported on `@metamask/assets-controllers`, so declare it here for now:
type CurrencyRateControllerMessenger = RestrictedMessenger<
  CurrencyRateController['name'],
  never,
  CurrencyRateControllerEvents,
  never,
  CurrencyRateControllerEvents['type']
>;

/**
 * Initialize the RatesController and set up CurrencyRateController sync.
 *
 * @param request - The request object.
 * @returns The RatesController.
 */
export const ratesControllerInit: ControllerInitFunction<
  RatesController,
  RatesControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new RatesController({
    messenger: controllerMessenger,
    state: (persistedState.RatesController as RatesController['state']) ?? {},
    includeUsdRate: true,
  });

  (
    controllerMessenger as unknown as CurrencyRateControllerMessenger
  ).subscribe(
    'CurrencyRateController:stateChange',
    (state: CurrencyRateState) => {
      if (state.currentCurrency) {
        controller.setFiatCurrency(state.currentCurrency).catch((error) => {
          Logger.error(
            error as Error,
            'RatesController: Failed to sync fiat currency with CurrencyRateController',
          );
        });
      }
    },
  );

  return { controller };
};
