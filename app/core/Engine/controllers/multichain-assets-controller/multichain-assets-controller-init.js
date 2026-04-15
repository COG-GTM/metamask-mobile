import {
  MultichainAssetsController } from


'@metamask/assets-controllers';


/**
 * Initialize the MultichainAssetsController.
 *
 * @param request - The request object.
 * @returns The MultichainAssetsController.
 */
export const multichainAssetsControllerInit =


(request) => {
  const { controllerMessenger, persistedState } = request;

  const multichainAssetsControllerState =
  persistedState.MultichainAssetsController;

  const controller = new MultichainAssetsController({
    messenger: controllerMessenger,
    state: multichainAssetsControllerState
  });

  return { controller };
};