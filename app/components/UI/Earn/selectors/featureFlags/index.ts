import { createSelector } from 'reselect';
import { selectRemoteFeatureFlags } from '../../../../../selectors/featureFlagController';
import { getVersion } from 'react-native-device-info';
import compareVersions from 'compare-versions';
import { isProduction } from '../../../../../util/environment';
import { EarnLaunchDarklyFlag } from './types';

const hasMinimumRequiredVersion = (minRequiredVersion: string) => {
  if (!minRequiredVersion) return false;
  const currentVersion = getVersion();
  return compareVersions.compare(currentVersion, minRequiredVersion, '>=');
};

/**
 * Resolves an Earn LaunchDarkly flag, gated on `minimumVersion`.
 *
 * @param remoteFlag - The remote flag value from RemoteFeatureFlagController.
 * @returns `undefined` when the remote flag is not set, so the local flag can act as a fallback.
 */
const earnRemoteFeatureFlag = (
  remoteFlag?: EarnLaunchDarklyFlag,
): boolean | undefined => {
  if (typeof remoteFlag?.enabled !== 'boolean') return undefined;
  return (
    remoteFlag.enabled && hasMinimumRequiredVersion(remoteFlag.minimumVersion)
  );
};

/**
 * Parses a local `MM_*` env feature flag.
 *
 * @param value - The raw env var value.
 * @returns `true` for `'true'`, `false` for any other value, or `undefined` when unset so the remote flag can act as a fallback.
 */
const parseLocalFlag = (value?: string): boolean | undefined =>
  value ? value === 'true' : undefined;

const prioritizeFlagsByEnv = (
  localFlag: boolean | undefined,
  remoteFlag?: EarnLaunchDarklyFlag,
): boolean => {
  if (isProduction()) {
    // Prioritize remote flag in production
    return earnRemoteFeatureFlag(remoteFlag) ?? localFlag ?? false;
  }

  // Prioritize local flag in development
  return localFlag ?? earnRemoteFeatureFlag(remoteFlag) ?? false;
};

export const selectPooledStakingEnabledFlag = createSelector(
  selectRemoteFeatureFlags,
  (remoteFeatureFlags) => {
    const localFlag = parseLocalFlag(process.env.MM_POOLED_STAKING_ENABLED);
    const remoteFlag =
      remoteFeatureFlags?.earnPooledStakingEnabled as unknown as EarnLaunchDarklyFlag;

    return prioritizeFlagsByEnv(localFlag, remoteFlag);
  },
);

export const selectPooledStakingServiceInterruptionBannerEnabledFlag =
  createSelector(selectRemoteFeatureFlags, (remoteFeatureFlags) => {
    const localFlag = parseLocalFlag(
      process.env.MM_POOLED_STAKING_SERVICE_INTERRUPTION_BANNER_ENABLED,
    );
    const remoteFlag =
      remoteFeatureFlags?.earnPooledStakingServiceInterruptionBannerEnabled as unknown as EarnLaunchDarklyFlag;

    return prioritizeFlagsByEnv(localFlag, remoteFlag);
  });

export const selectStablecoinLendingEnabledFlag = createSelector(
  selectRemoteFeatureFlags,
  (remoteFeatureFlags): boolean => {
    const localFlag = parseLocalFlag(
      process.env.MM_STABLECOIN_LENDING_UI_ENABLED,
    );
    const remoteFlag =
      remoteFeatureFlags?.earnStablecoinLendingEnabled as unknown as EarnLaunchDarklyFlag;

    return prioritizeFlagsByEnv(localFlag, remoteFlag);
  },
);

export const selectStablecoinLendingServiceInterruptionBannerEnabledFlag =
  createSelector(selectRemoteFeatureFlags, (remoteFeatureFlags) => {
    const localFlag = parseLocalFlag(
      process.env.MM_STABLE_COIN_SERVICE_INTERRUPTION_BANNER_ENABLED,
    );
    const remoteFlag =
      remoteFeatureFlags?.earnStablecoinLendingServiceInterruptionBannerEnabled as unknown as EarnLaunchDarklyFlag;

    return prioritizeFlagsByEnv(localFlag, remoteFlag);
  });
