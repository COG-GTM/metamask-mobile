import type { RemoteFeatureFlagController, RemoteFeatureFlagControllerMessenger } from '@metamask/remote-feature-flag-controller';
import type { ControllerInitFunction } from '../../types';
import { selectBasicFunctionalityEnabled } from '../../../../selectors/settings';
import { createRemoteFeatureFlagController } from './utils';

/**
 * Creates the RemoteFeatureFlagController init function with the given metaMetricsId.
 *
 * @param metaMetricsId - Optional MetaMetrics ID for feature flag user targeting.
 * @returns The controller init function.
 */
export const createRemoteFeatureFlagControllerInit = (
  metaMetricsId?: string,
): ControllerInitFunction<
  RemoteFeatureFlagController,
  RemoteFeatureFlagControllerMessenger
> => (request) => {
  const { controllerMessenger, getState } = request;

  const controller = createRemoteFeatureFlagController({
    messenger: controllerMessenger,
    disabled: !selectBasicFunctionalityEnabled(getState()),
    getMetaMetricsId: () => metaMetricsId ?? '',
  });

  return { controller };
};
