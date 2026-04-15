import { hasProperty, isObject } from '@metamask/utils';
import { createSelector } from 'reselect';
import { selectRemoteFeatureFlags } from '..';
import { getFeatureFlagValue } from '../env';

// A type predicate's type must be assignable to its parameter's type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions







const isRemoteFeatureFlagValuesValid = (
obj) =>

isObject(obj) &&
hasProperty(obj, 'signatures') &&
hasProperty(obj, 'staking_confirmations') &&
hasProperty(obj, 'contract_interaction');

const confirmationRedesignFlagsDefaultValues =
{
  signatures: true,
  staking_confirmations: false,
  contract_interaction: false,
  transfer: false
};

export const selectConfirmationRedesignFlagsFromRemoteFeatureFlags = (
remoteFeatureFlags) =>
{
  const remoteValues = remoteFeatureFlags.confirmation_redesign;

  const confirmationRedesignFlags = isRemoteFeatureFlagValuesValid(
    remoteValues
  ) ?
  remoteValues :
  confirmationRedesignFlagsDefaultValues;

  const isSignaturesEnabled = getFeatureFlagValue(
    process.env.FEATURE_FLAG_REDESIGNED_SIGNATURES,
    confirmationRedesignFlags.signatures
  );

  const isStakingConfirmationsEnabled = getFeatureFlagValue(
    process.env.FEATURE_FLAG_REDESIGNED_STAKING_TRANSACTIONS,
    confirmationRedesignFlags.staking_confirmations
  );

  const isContractInteractionEnabled = getFeatureFlagValue(
    process.env.FEATURE_FLAG_REDESIGNED_CONTRACT_INTERACTION,
    // TODO: This will be pick up values from the remote feature flag once the
    // feature is ready to be rolled out
    false
  );

  // TODO: This will be pick up values from the remote feature flag once the feature is ready
  // Task is created but still in draft
  const isTransferEnabled = process.env.FEATURE_FLAG_REDESIGNED_TRANSFER === 'true';

  return {
    signatures: isSignaturesEnabled,
    staking_confirmations: isStakingConfirmationsEnabled,
    contract_interaction: isContractInteractionEnabled,
    transfer: isTransferEnabled
  };
};

export const selectConfirmationRedesignFlags = createSelector(
  selectRemoteFeatureFlags,
  selectConfirmationRedesignFlagsFromRemoteFeatureFlags
);