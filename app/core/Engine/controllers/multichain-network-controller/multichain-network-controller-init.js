import {
  MultichainNetworkController } from


'@metamask/multichain-network-controller';


/**
 * Initialize the MultichainNetworkController.
 *
 * @param request - The request object.
 * @returns The MultichainNetworkController.
 */
export const multichainNetworkControllerInit =


(request) => {
  const { controllerMessenger, persistedState } = request;

  const multichainNetworkControllerState =
  persistedState.MultichainNetworkController;

  const controller = new MultichainNetworkController({
    messenger: controllerMessenger,
    state: multichainNetworkControllerState
  });

  return { controller };
};