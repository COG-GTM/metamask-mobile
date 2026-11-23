import { createSelector } from 'reselect';
import { RootState } from '../reducers';
import { createDeepEqualSelector } from './util';
import { selectEvmChainId } from './networkController';
import { selectSelectedInternalAccountFormattedAddress } from './accountsController';

const selectAccountsByChainIdRaw = (state: RootState) =>
  state.engine.backgroundState.AccountTrackerController.accountsByChainId;

export const selectAccountsByChainId = createDeepEqualSelector(
  selectAccountsByChainIdRaw,
  (accountsByChainId) => accountsByChainId,
);

export const selectAccounts = createSelector(
  selectAccountsByChainId,
  selectEvmChainId,
  (accountsByChainId, chainId) => accountsByChainId?.[chainId] || {},
);

export const selectAccountsLength = createSelector(
  selectAccounts,
  (accounts) => Object.keys(accounts).length,
);

export const selectAccountBalanceByChainId = createSelector(
  selectAccountsByChainId,
  selectEvmChainId,
  selectSelectedInternalAccountFormattedAddress,
  (accountsByChainId, chainId, selectedInternalAccountChecksummedAddress) => {
    const accountsBalance = selectedInternalAccountChecksummedAddress
      ? accountsByChainId?.[chainId]?.[
          selectedInternalAccountChecksummedAddress
        ]
      : undefined;
    return accountsBalance;
  },
);
