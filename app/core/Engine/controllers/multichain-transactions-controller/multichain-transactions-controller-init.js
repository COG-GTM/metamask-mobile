import {
  MultichainTransactionsController } from

'@metamask/multichain-transactions-controller';



/**
 * Initialize the MultichainTransactionsController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const multichainTransactionsControllerInit =


(request) => {
  const { controllerMessenger, persistedState } = request;

  const multichainTransactionsControllerState =
  persistedState.MultichainTransactionsController;

  const controller = new MultichainTransactionsController({
    messenger: controllerMessenger,
    state: multichainTransactionsControllerState
  });

  return { controller };
};