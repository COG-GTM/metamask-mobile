import {
  MultichainBalancesController } from


'@metamask/assets-controllers';


/**
 * Initialize the MultichainBalancesController.
 *
 * @param request - The request object.
 * @returns The MultichainBalancesController.
 */
export const multichainBalancesControllerInit =


(request) => {
  const { controllerMessenger, persistedState } = request;

  const multichainBalancesControllerState =
  persistedState.MultichainBalancesController;

  const controller = new MultichainBalancesController({
    messenger: controllerMessenger,
    state: multichainBalancesControllerState
  });

  return { controller };
};