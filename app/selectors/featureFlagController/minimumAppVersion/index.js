import { createSelector } from 'reselect';
import { selectRemoteFeatureFlags } from '../.';
import {
  FEATURE_FLAG_NAME } from

'./types';
import { hasProperty, isObject } from '@metamask/utils';
import { defaultValues } from './constants';

const isMinimumAppVersionType = (obj) =>

isObject(obj) &&
hasProperty(obj, 'appMinimumBuild') &&
hasProperty(obj, 'appleMinimumOS') &&
hasProperty(obj, 'androidMinimumAPIVersion');

export const selectMobileMinimumVersions = createSelector(
  selectRemoteFeatureFlags,
  (remoteFeatureFlags) => {
    const remoteFeatureFlag = remoteFeatureFlags[FEATURE_FLAG_NAME];

    return isMinimumAppVersionType(remoteFeatureFlag) ?
    remoteFeatureFlag :
    defaultValues;
  }
);

export const selectAppMinimumBuild = createSelector(
  selectMobileMinimumVersions,
  ({ appMinimumBuild }) => appMinimumBuild
);

export const selectAppleMinimumOS = createSelector(
  selectMobileMinimumVersions,
  ({ appleMinimumOS }) => appleMinimumOS
);

export const selectAndroidMinimumAPI = createSelector(
  selectMobileMinimumVersions,
  ({ androidMinimumAPIVersion }) => androidMinimumAPIVersion
);