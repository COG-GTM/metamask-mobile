import { createSelector } from 'reselect';
import { AccountTrackerControllerState } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { RootState } from '../reducers';
import { createDeepEqualSelector } from './util';
import { selectEvmChainId } from './networkController';
import { selectSelectedInternalAccountFormattedAddress } from './accountsController';

const selectAccountTrackerControllerState = (state: RootState) =>
  state.engine.backgroundState.AccountTrackerController;

export const selectAccountsByChainId = createDeepEqualSelector(
  selectAccountTrackerControllerState,
  (accountTrackerControllerState: AccountTrackerControllerState) =>
    accountTrackerControllerState.accountsByChainId,
);

/**
 * Returns the native balance (hex wei) of `address` on `chainId`, matching the
 * address case-insensitively and scanning only that chain's accounts.
 */
export const selectNativeBalanceByChainIdAndAddress = (
  state: RootState,
  chainId: Hex | undefined,
  address: string | undefined,
): string => {
  if (!chainId || !address) {
    return '0x0';
  }

  const accounts = selectAccountsByChainId(state)?.[chainId];
  if (!accounts) {
    return '0x0';
  }

  const exactMatch = accounts[address];
  if (exactMatch) {
    return exactMatch.balance ?? '0x0';
  }

  const lowercaseAddress = address.toLowerCase();
  const matchingKey = Object.keys(accounts).find(
    (accountAddress) => accountAddress.toLowerCase() === lowercaseAddress,
  );

  return (matchingKey && accounts[matchingKey]?.balance) || '0x0';
};

export const selectAccounts = createDeepEqualSelector(
  selectAccountsByChainId,
  selectEvmChainId,
  selectSelectedInternalAccountFormattedAddress,
  (accountsByChainId, chainId) => accountsByChainId?.[chainId] || {},
);

export const selectAccountsLength = createSelector(
  selectAccounts,
  (accounts) => Object.keys(accounts).length,
);

export const selectAccountBalanceByChainId = createDeepEqualSelector(
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
