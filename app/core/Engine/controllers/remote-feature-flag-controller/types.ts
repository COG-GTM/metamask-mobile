import { RemoteFeatureFlagControllerMessenger, RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';

export interface RemoteFeatureFlagInitParamTypes {
  state?: RemoteFeatureFlagControllerState;
  messenger: RemoteFeatureFlagControllerMessenger;
  disabled: boolean;
  getMetaMetricsId: () => string;
  fetchInterval?: number;
  /** Defaults to OVERRIDE_REMOTE_FEATURE_FLAGS === 'true' at build time. */
  overrideActivated?: boolean;
}

