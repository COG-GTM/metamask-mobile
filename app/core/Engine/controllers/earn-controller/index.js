
import {
  EarnController,

  getDefaultEarnControllerState } from
'@metamask/earn-controller';

/**
 * Initialize the EarnController.
 *
 * @param request - The request object.
 * @returns The EarnController.
 */
export const earnControllerInit =


(request) => {
  const { controllerMessenger, persistedState } = request;

  const earnControllerState =
  persistedState.EarnController ?? getDefaultEarnControllerState();

  const controller = new EarnController({
    messenger: controllerMessenger,
    state: earnControllerState
  });

  return { controller };
};