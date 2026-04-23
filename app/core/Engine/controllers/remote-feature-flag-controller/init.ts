import {
  RemoteFeatureFlagController,
  type RemoteFeatureFlagControllerMessenger,
} from '@metamask/remote-feature-flag-controller';
import type { ControllerInitFunction } from '../../types';
import { createRemoteFeatureFlagController } from './utils';
import { selectBasicFunctionalityEnabled } from '../../../../selectors/settings';

/**
 * Initialize the RemoteFeatureFlagController.
 *
 * @param request - The request object.
 * @returns The RemoteFeatureFlagController.
 */
export const remoteFeatureFlagControllerInit: ControllerInitFunction<
  RemoteFeatureFlagController,
  RemoteFeatureFlagControllerMessenger
>= (request) => {
 const { controllerMessenger, getState, metaMetricsId } = request;

 const isBasicFunctionalityToggleEnabled = () =>
   selectBasicFunctionalityEnabled(getState());

 const controller = createRemoteFeatureFlagController({
   messenger: controllerMessenger,
   disabled: !isBasicFunctionalityToggleEnabled(),
   getMetaMetricsId: () => metaMetricsId ?? '',
 });

  return { controller };
};
