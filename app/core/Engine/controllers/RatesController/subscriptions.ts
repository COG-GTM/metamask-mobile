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
 * `CurrencyRateController` publishes a state change on every rate poll, but
 * `setFiatCurrency` always triggers an exchange-rate fetch, so this only syncs
 * when `currentCurrency` differs from the last successfully synced currency (or
 * the currency of a sync that is still in flight). A failed sync is retried on
 * the next state change. Regular refreshes are left to RatesController's own
 * polling.
 * @param controllerMessenger - The main controller messenger
 * @param ratesController - The RatesController instance to sync with
 */
export const setupCurrencyRateSync = (
  controllerMessenger: CurrencyRateControllerMessenger,
  ratesController: RatesController,
): void => {
  let syncedFiatCurrency: string | undefined =
    ratesController.state.fiatCurrency;
  let pendingFiatCurrency: string | undefined;

  controllerMessenger.subscribe(
    'CurrencyRateController:stateChange',
    (state: CurrencyRateState) => {
      const { currentCurrency } = state;
      if (
        !currentCurrency ||
        currentCurrency === (pendingFiatCurrency ?? syncedFiatCurrency)
      ) {
        return;
      }

      pendingFiatCurrency = currentCurrency;
      ratesController
        .setFiatCurrency(currentCurrency)
        .then(() => {
          syncedFiatCurrency = currentCurrency;
        })
        .catch((error) => {
          if (syncedFiatCurrency === currentCurrency) {
            syncedFiatCurrency = undefined;
          }
          Logger.error(
            error as Error,
            'RatesController: Failed to sync fiat currency with CurrencyRateController',
          );
        })
        .finally(() => {
          if (pendingFiatCurrency === currentCurrency) {
            pendingFiatCurrency = undefined;
          }
        });
    },
  );
};
