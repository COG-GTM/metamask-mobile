





import Logger from '../../../../util/Logger';


// FIXME: This messenger type is not exported on `@metamask/assets-controllers`, so declare it here for now:








/**
 * Sets up subscription to sync CurrencyRateController changes with RatesController
 * @param controllerMessenger - The main controller messenger
 * @param ratesController - The RatesController instance to sync with
 */
export const setupCurrencyRateSync = (
controllerMessenger,
ratesController) =>
{
  controllerMessenger.subscribe(
    'CurrencyRateController:stateChange',
    (state) => {
      if (state.currentCurrency) {
        ratesController.
        setFiatCurrency(state.currentCurrency).
        catch((error) => {
          Logger.error(
            error,
            'RatesController: Failed to sync fiat currency with CurrencyRateController'
          );
        });
      }
    }
  );
};