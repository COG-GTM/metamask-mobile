import { createSelector } from 'reselect';
import { selectRemoteFeatureFlags } from '../../../../../selectors/featureFlagController';
import { getVersion } from 'react-native-device-info';
import compareVersions from 'compare-versions';
import { isProduction } from '../../../../../util/environment';


const hasMinimumRequiredVersion = (minRequiredVersion) => {
  if (!minRequiredVersion) return false;
  const currentVersion = getVersion();
  return compareVersions.compare(currentVersion, minRequiredVersion, '>=');
};

const earnRemoteFeatureFlag = (remoteFlag) =>
Boolean(remoteFlag?.enabled) &&
hasMinimumRequiredVersion(remoteFlag?.minimumVersion);

const prioritizeFlagsByEnv = (
localFlag,
remoteFlag) =>
{
  if (isProduction()) {
    // Prioritize remote flag in production
    return earnRemoteFeatureFlag(remoteFlag) ?? localFlag;
  }

  // Prioritize local flag in development
  return localFlag ?? earnRemoteFeatureFlag(remoteFlag);
};

export const selectPooledStakingEnabledFlag = createSelector(
  selectRemoteFeatureFlags,
  (remoteFeatureFlags) => {
    const localFlag = process.env.MM_POOLED_STAKING_ENABLED === 'true';
    const remoteFlag =
    remoteFeatureFlags?.earnPooledStakingEnabled;

    return prioritizeFlagsByEnv(localFlag, remoteFlag);
  }
);

export const selectPooledStakingServiceInterruptionBannerEnabledFlag =
createSelector(selectRemoteFeatureFlags, (remoteFeatureFlags) => {
  const localFlag =
  process.env.MM_POOLED_STAKING_SERVICE_INTERRUPTION_BANNER_ENABLED ===
  'true';
  const remoteFlag =
  remoteFeatureFlags?.earnPooledStakingServiceInterruptionBannerEnabled;

  return prioritizeFlagsByEnv(localFlag, remoteFlag);
});

export const selectStablecoinLendingEnabledFlag = createSelector(
  selectRemoteFeatureFlags,
  (remoteFeatureFlags) => {
    const localFlag = process.env.MM_STABLECOIN_LENDING_UI_ENABLED === 'true';
    const remoteFlag =
    remoteFeatureFlags?.earnStablecoinLendingEnabled;

    return prioritizeFlagsByEnv(localFlag, remoteFlag);
  }
);

export const selectStablecoinLendingServiceInterruptionBannerEnabledFlag =
createSelector(selectRemoteFeatureFlags, (remoteFeatureFlags) => {
  const localFlag =
  process.env.MM_STABLE_COIN_SERVICE_INTERRUPTION_BANNER_ENABLED === 'true';
  const remoteFlag =
  remoteFeatureFlags?.earnStablecoinLendingServiceInterruptionBannerEnabled;

  return prioritizeFlagsByEnv(localFlag, remoteFlag);
});