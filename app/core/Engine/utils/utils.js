import { createProjectLogger } from '@metamask/utils';










import { CONTROLLER_MESSENGERS } from '../messengers';

const log = createProjectLogger('controller-init');













/**
 * Initializes the controllers in the engine in a modular way.
 *
 * @param options - Options bag.
 * @param options.baseControllerMessenger - Unrestricted base controller messenger.
 * @param options.controllerInitFunctions - Map of init functions keyed by controller name.
 * @param options.existingControllersByName - All required controllers that have already been initialized.
 * @param options.getGlobalChainId - Get settled chain id in the engine.
 * @param options.getState - Get the root state of the engine.
 * @param options.persistedState - The full persisted state for all controllers.
 * @returns The initialized controllers and associated data.
 */
export const initModularizedControllers = ({
  baseControllerMessenger,
  controllerInitFunctions,
  existingControllersByName,
  ...initRequest
}) => {
  log('Initializing controllers', Object.keys(controllerInitFunctions).length);

  // Used by other controllers to get dependent controllers
  const getController = (
  name) =>

  getControllerOrThrow({
    controller: existingControllersByName?.[name],
    name
  });

  for (const [key, controllerInitFunction] of Object.entries(
    controllerInitFunctions
  )) {
    const controllerName = key;

    const initFunction = controllerInitFunction;



    // Get the messenger for the controller
    const messengerCallbacks = CONTROLLER_MESSENGERS[controllerName];

    const controllerMessengerCallback =
    messengerCallbacks.getMessenger;

    const initMessengerCallback =
    messengerCallbacks?.getInitMessenger;

    const controllerMessenger = controllerMessengerCallback(
      baseControllerMessenger
    );

    const initMessenger = initMessengerCallback?.(baseControllerMessenger);

    const finalInitRequest = {
      controllerMessenger,
      getController,
      initMessenger,
      ...initRequest
    };

    // Initialize the controller
    const { controller } = initFunction(finalInitRequest);

    // Add the controller to the existing controllers by name
    existingControllersByName = {
      ...existingControllersByName,
      [controllerName]: controller
    };

    log('Initialized controller', controllerName);
  }

  return {
    controllersByName: existingControllersByName
  };
};

/**
 * Gets a controller from the existing controllers by name.
 * Throws an error if the controller is not found.
 *
 * @param options - Options containing the controller and name.
 * @param options.controller - The controller to get.
 * @param options.name - The name of the controller.
 * @returns The controller.
 */
export function getControllerOrThrow({
  controller,
  name



}) {
  if (!controller) {
    throw new Error(`Controller requested before it was initialized: ${name}`);
  }

  return controller;
}