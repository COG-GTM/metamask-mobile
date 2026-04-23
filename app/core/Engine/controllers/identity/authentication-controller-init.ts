///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import type {
  AuthenticationControllerMessenger,
  AuthenticationControllerState,
} from '@metamask/profile-sync-controller/auth';
import { Controller as AuthenticationController } from '@metamask/profile-sync-controller/auth';
import { Platform } from '@metamask/profile-sync-controller/sdk';
import type { ControllerInitFunction } from '../../types';
import { MetaMetrics } from '../../../Analytics';

/**
 * Initialize the AuthenticationController.
 *
 * @param request - The request object.
 * @returns The AuthenticationController.
 */
export const authenticationControllerInit: ControllerInitFunction<
  AuthenticationController,
  AuthenticationControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new AuthenticationController({
    messenger: controllerMessenger,
    state:
      persistedState.AuthenticationController as AuthenticationControllerState,
    metametrics: {
      agent: Platform.MOBILE,
      getMetaMetricsId: async () =>
        (await MetaMetrics.getInstance().getMetaMetricsId()) || '',
    },
  });

  return { controller };
};
///: END:ONLY_INCLUDE_IF
