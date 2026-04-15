import {
  CurrencyRateController } from


'@metamask/assets-controllers';



import { defaultCurrencyRateState } from './constants';

/**
 * Initialize the CurrencyRateController.
 *
 * @param request - The request object.
 * @returns The CurrencyRateController.
 */

// TODO: Remove once the CurrencyRateMessenger is properly exported from module








// Define the currency rate type based on usage






export const currencyRateControllerInit =


(request) => {
  const { controllerMessenger, persistedState } = request;

  // Get the persisted state or use default state
  const persistedCurrencyRateState =
  persistedState.CurrencyRateController ?? defaultCurrencyRateState;

  // Normalize the currency rates to ensure conversionRate is never null
  const normalizedCurrencyRates = {};
  const currencyRates =
  persistedCurrencyRateState.currencyRates ??
  defaultCurrencyRateState.currencyRates;

  // Normalize each currency rate to ensure conversionRate is never null
  Object.entries(currencyRates).forEach(([key, value]) => {
    normalizedCurrencyRates[key] = {
      ...value,
      conversionRate: value.conversionRate ?? 0
    };
  });

  const controller = new CurrencyRateController({
    includeUsdRate: true,
    messenger: controllerMessenger,
    state: {
      ...persistedCurrencyRateState,
      currencyRates: normalizedCurrencyRates
    }
  });

  return { controller };
};