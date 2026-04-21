import {
  AuthenticationControllerMessenger,
  Controller as AuthenticationController,
} from '@metamask/profile-sync-controller/auth';
import { Platform } from '@metamask/profile-sync-controller/sdk';
import type { ControllerInitFunction } from '../../types';
import { MetaMetrics } from '../../../Analytics';

export const authenticationControllerInit: ControllerInitFunction<
  AuthenticationController,
  AuthenticationControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new AuthenticationController({
    messenger: controllerMessenger,
    state: persistedState.AuthenticationController,
    metametrics: {
      agent: Platform.MOBILE,
      getMetaMetricsId: async () =>
        (await MetaMetrics.getInstance().getMetaMetricsId()) || '',
    },
  });

  return { controller };
};
