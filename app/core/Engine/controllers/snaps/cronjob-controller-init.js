import { CronjobController } from '@metamask/snaps-controllers';



/**
 * Initialize the cronjob controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const cronjobControllerInit =


({ controllerMessenger, persistedState }) => {
  const controller = new CronjobController({
    // @ts-expect-error: `persistedState.CronjobController` is not compatible
    // with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.CronjobController,
    messenger: controllerMessenger
  });

  return {
    controller
  };
};