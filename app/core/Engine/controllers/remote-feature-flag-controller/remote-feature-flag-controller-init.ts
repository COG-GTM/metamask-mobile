import {
  RemoteFeatureFlagController,
  type RemoteFeatureFlagControllerMessenger,
} from '@metamask/remote-feature-flag-controller';

import type { ControllerInitFunction } from '../../types';
import { selectBasicFunctionalityEnabled } from '../../../../selectors/settings';
import { createRemoteFeatureFlagController } from './utils';

export const remoteFeatureFlagControllerInit: ControllerInitFunction<
  RemoteFeatureFlagController,
  RemoteFeatureFlagControllerMessenger
> = (request) => {
  const { controllerMessenger, getMetaMetricsId, getState } = request;

  const controller = createRemoteFeatureFlagController({
    messenger: controllerMessenger,
    disabled: !selectBasicFunctionalityEnabled(getState()),
    getMetaMetricsId: () => getMetaMetricsId() ?? '',
  });

  return { controller };
};
