import {
  AppMetadataController } from


'@metamask/app-metadata-controller';
import { logAppMetadataControllerCreation } from './utils';

import { defaultAppMetadataControllerState } from './constants';

// Export types


// Export constants
export * from './constants';

/**
 * Initialize the AppMetadataController.
 *
 * @param request - The request object.
 * @returns The AppMetadataController.
 */
export const appMetadataControllerInit =


(request) => {
  const { controllerMessenger, persistedState } = request;

  const appMetadataControllerState = persistedState.AppMetadataController ??
  defaultAppMetadataControllerState;

  logAppMetadataControllerCreation(appMetadataControllerState);

  const controller = new AppMetadataController({
    messenger: controllerMessenger,
    state: appMetadataControllerState
  });

  return { controller };
};