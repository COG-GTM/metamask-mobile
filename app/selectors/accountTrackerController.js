import { createSelector } from 'reselect';


import { createDeepEqualSelector } from './util';
import { selectEvmChainId } from './networkController';
import { selectSelectedInternalAccountFormattedAddress } from './accountsController';

const selectAccountTrackerControllerState = (state) =>
state.engine.backgroundState.AccountTrackerController;

export const selectAccountsByChainId = createDeepEqualSelector(
  selectAccountTrackerControllerState,
  (accountTrackerControllerState) =>
  accountTrackerControllerState.accountsByChainId
);

export const selectAccounts = createDeepEqualSelector(
  selectAccountsByChainId,
  selectEvmChainId,
  selectSelectedInternalAccountFormattedAddress,
  (accountsByChainId, chainId) => accountsByChainId?.[chainId] || {}
);

export const selectAccountsLength = createSelector(
  selectAccounts,
  (accounts) => Object.keys(accounts).length
);

export const selectAccountBalanceByChainId = createDeepEqualSelector(
  selectAccountsByChainId,
  selectEvmChainId,
  selectSelectedInternalAccountFormattedAddress,
  (accountsByChainId, chainId, selectedInternalAccountChecksummedAddress) => {
    const accountsBalance = selectedInternalAccountChecksummedAddress ?
    accountsByChainId?.[chainId]?.[
    selectedInternalAccountChecksummedAddress] :

    undefined;
    return accountsBalance;
  }
);