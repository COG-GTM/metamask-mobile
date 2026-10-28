import { createSelector } from 'reselect';
import { isEqual } from 'lodash';
import { RootState } from '../reducers';
import { selectEvmChainId } from './networkController';
import { selectSelectedInternalAccountFormattedAddress } from './accountsController';

const selectAccountsByChainIdRaw = (state: RootState) =>
  state.engine.backgroundState.AccountTrackerController.accountsByChainId;

// AccountTrackerController rebuilds `accountsByChainId` (cloneDeep) on every
// refresh, so the map is deep-compared once here and every downstream selector
// can rely on reference equality.
export const selectAccountsByChainId = createSelector(
  selectAccountsByChainIdRaw,
  (accountsByChainId) => accountsByChainId,
  { memoizeOptions: { resultEqualityCheck: isEqual } },
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
  (accountsByChainId, chainId, selectedInternalAccountChecksummedAddress) =>
    selectedInternalAccountChecksummedAddress
      ? accountsByChainId?.[chainId]?.[
          selectedInternalAccountChecksummedAddress
        ]
      : undefined,
  { memoizeOptions: { resultEqualityCheck: isEqual } },
);
