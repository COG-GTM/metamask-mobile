import {
  RatesController,
  CurrencyRateState,
  CurrencyRateController,
  CurrencyRateControllerEvents,
} from '@metamask/assets-controllers';
import Logger from '../../../../util/Logger';
import { RestrictedMessenger } from '@metamask/base-controller';

// FIXME: This messenger type is not exported on `@metamask/assets-controllers`, so declare it here for now:
type CurrencyRateControllerMessenger = RestrictedMessenger<
  CurrencyRateController['name'],
  never,
  CurrencyRateControllerEvents,
  never,
  CurrencyRateControllerEvents['type']
>;

/**
 * Sets up subscription to sync CurrencyRateController changes with RatesController.
 * Only syncs when `currentCurrency` differs from the RatesController fiat
 * currency, since `setFiatCurrency` always writes state and fetches rates.
 * @param controllerMessenger - The main controller messenger
 * @param ratesController - The RatesController instance to sync with
 */
export const setupCurrencyRateSync = (
  controllerMessenger: CurrencyRateControllerMessenger,
  ratesController: RatesController,
): void => {
  controllerMessenger.subscribe(
    'CurrencyRateController:stateChange',
    ({ currentCurrency }: CurrencyRateState) => {
      if (
        currentCurrency &&
        currentCurrency !== ratesController.state.fiatCurrency
      ) {
        ratesController.setFiatCurrency(currentCurrency).catch((error) => {
          Logger.error(
            error as Error,
            'RatesController: Failed to sync fiat currency with CurrencyRateController',
          );
        });
      }
    },
  );
};
