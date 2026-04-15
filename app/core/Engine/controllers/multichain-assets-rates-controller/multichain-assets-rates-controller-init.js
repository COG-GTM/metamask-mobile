import {
  MultichainAssetsRatesController } from


'@metamask/assets-controllers';


/**
 * Initialize the MultichainAssetsRatesController.
 *
 * @param request - The request object.
 * @returns The MultichainAssetsRatesController.
 */
export const multichainAssetsRatesControllerInit =


(request) => {
  const { controllerMessenger, persistedState } = request;

  const multichainAssetsRatesControllerState =
  persistedState.MultichainAssetsRatesController;

  const controller = new MultichainAssetsRatesController({
    messenger: controllerMessenger,
    state: multichainAssetsRatesControllerState
  });

  return { controller };
};