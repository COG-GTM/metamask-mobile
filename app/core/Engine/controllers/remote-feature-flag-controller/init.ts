import type { RemoteFeatureFlagController, RemoteFeatureFlagControllerMessenger } from '@metamask/remote-feature-flag-controller';
import type { ControllerInitFunction } from '../../types';
import { selectBasicFunctionalityEnabled } from '../../../../selectors/settings';
import { createRemoteFeatureFlagController } from './utils';

/**
 * Initialize the RemoteFeatureFlagController.
 *
 * @param request - The request object.
 * @returns The RemoteFeatureFlagController.
 */
export const remoteFeatureFlagControllerInit: ControllerInitFunction<
  RemoteFeatureFlagController,
  RemoteFeatureFlagControllerMessenger
> = (request) => {
  const { controllerMessenger, getState } = request;

  const controller = createRemoteFeatureFlagController({
    messenger: controllerMessenger,
    disabled: !selectBasicFunctionalityEnabled(getState()),
    getMetaMetricsId: () => '',
  });

  return { controller };
};
