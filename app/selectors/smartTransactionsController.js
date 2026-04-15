import { selectSmartTransactionsOptInStatus } from './preferencesController';

import { swapsSmartTxFlagEnabled } from '../reducers/swaps';
import { isHardwareAccount } from '../util/address';
import { selectEvmChainId, selectRpcUrlByChainId } from './networkController';
import {

  SmartTransactionStatuses } from
'@metamask/smart-transactions-controller/dist/types';
import { selectSelectedInternalAccountFormattedAddress } from './accountsController';
import { getAllowedSmartTransactionsChainIds } from '../../app/constants/smartTransactions';
import { createDeepEqualSelector } from './util';

import { getIsAllowedRpcUrlForSmartTransactions } from '../util/smart-transactions';

export const selectSmartTransactionsEnabled = createDeepEqualSelector(
  [
  selectSelectedInternalAccountFormattedAddress,
  selectEvmChainId,
  (_state, chainId) => chainId,
  (state, chainId) =>
  selectRpcUrlByChainId(state, chainId || selectEvmChainId(state)),
  swapsSmartTxFlagEnabled,
  (state) =>
  state.engine.backgroundState.SmartTransactionsController.
  smartTransactionsState?.liveness],

  (
  selectedAddress,
  globalChainId,
  transactionChainId,
  providerConfigRpcUrl,
  smartTransactionsFeatureFlagEnabled,
  smartTransactionsLiveness) =>
  {
    const effectiveChainId = transactionChainId || globalChainId;
    const addressIsHardwareAccount = selectedAddress ?
    isHardwareAccount(selectedAddress) :
    false;
    const isAllowedNetwork =
    getAllowedSmartTransactionsChainIds().includes(effectiveChainId);
    return Boolean(
      isAllowedNetwork &&
      !addressIsHardwareAccount &&
      getIsAllowedRpcUrlForSmartTransactions(providerConfigRpcUrl) &&
      smartTransactionsFeatureFlagEnabled &&
      smartTransactionsLiveness
    );
  }
);

export const selectShouldUseSmartTransaction = createDeepEqualSelector(
  [selectSmartTransactionsEnabled, selectSmartTransactionsOptInStatus],
  (smartTransactionsEnabled, smartTransactionsOptInStatus) =>
  smartTransactionsEnabled && smartTransactionsOptInStatus
);

export const selectPendingSmartTransactionsBySender = createDeepEqualSelector(
  [
  selectSelectedInternalAccountFormattedAddress,
  selectEvmChainId,
  (state) =>
  state.engine.backgroundState.SmartTransactionsController?.
  smartTransactionsState?.smartTransactions || {}],

  (
  selectedAddress,
  chainId,
  smartTransactionsByChainId) =>
  {
    const smartTransactions =
    smartTransactionsByChainId[chainId] || [];
    return smartTransactions.
    filter((stx) => {
      const { txParams } = stx;
      return (
        txParams?.from.toLowerCase() === selectedAddress?.toLowerCase() &&
        ![
        SmartTransactionStatuses.SUCCESS,
        SmartTransactionStatuses.CANCELLED].
        includes(stx.status));

    }).
    map((stx) => ({
      ...stx,
      // Use stx.uuid as the id since tx.id is generated client-side.
      id: stx.uuid,
      status: stx.status?.startsWith(SmartTransactionStatuses.CANCELLED) ?
      SmartTransactionStatuses.CANCELLED :
      stx.status,
      isSmartTransaction: true
    }));
  }
);

export const selectSmartTransactionsForCurrentChain = (state) => {
  const chainId = selectEvmChainId(state);
  return (
    state.engine.backgroundState.SmartTransactionsController?.
    smartTransactionsState?.smartTransactions?.[chainId] || []);

};