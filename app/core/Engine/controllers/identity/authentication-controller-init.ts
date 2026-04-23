import {
  Controller as AuthenticationController,
  AuthenticationControllerMessenger,
} from '@metamask/profile-sync-controller/auth';
import { Platform } from '@metamask/profile-sync-controller/sdk';
import type { ControllerInitFunction } from '../../types';
import { MetaMetrics } from '../../../Analytics';
import { createAuthenticationController } from './create-authentication-controller';

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

  const controller = createAuthenticationController({
    messenger: controllerMessenger,
    initialState: persistedState.AuthenticationController,
    metametrics: {
      agent: Platform.MOBILE,
      getMetaMetricsId: async () =>
        (await MetaMetrics.getInstance().getMetaMetricsId()) || '',
    },
  });

  return { controller };
};
