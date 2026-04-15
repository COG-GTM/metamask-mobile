import { createSelector } from 'reselect';
import { isRemoteFeatureFlagOverrideActivated } from '../../core/Engine/controllers/remote-feature-flag-controller';


export const selectRemoteFeatureFlagControllerState = (
state) =>
state.engine.backgroundState.RemoteFeatureFlagController;

export const selectRemoteFeatureFlags = createSelector(
  selectRemoteFeatureFlagControllerState,
  (remoteFeatureFlagControllerState) => {
    if (isRemoteFeatureFlagOverrideActivated) {
      return {};
    }
    return remoteFeatureFlagControllerState?.remoteFeatureFlags ?? {};
  }
);