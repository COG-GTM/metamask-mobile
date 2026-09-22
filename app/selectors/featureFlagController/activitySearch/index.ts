import { createSelector } from 'reselect';
import { hasProperty } from '@metamask/utils';
import { selectRemoteFeatureFlags } from '..';

const DEFAULT_ACTIVITY_SEARCH_ENABLED = false;
export const FEATURE_FLAG_NAME = 'activitySearchEnabled';

export const selectActivitySearchEnabled = createSelector(
  selectRemoteFeatureFlags,
  (remoteFeatureFlags) =>
    hasProperty(remoteFeatureFlags, FEATURE_FLAG_NAME)
      ? (remoteFeatureFlags[FEATURE_FLAG_NAME] as boolean)
      : DEFAULT_ACTIVITY_SEARCH_ENABLED,
);
