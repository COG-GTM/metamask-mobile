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

const lowercaseAddressIndexCache = new WeakMap<object, Map<string, string>>();

const getLowercaseAddressIndex = (accounts: Record<string, unknown>) => {
  let index = lowercaseAddressIndexCache.get(accounts);
  if (!index) {
    index = new Map(
      Object.keys(accounts).map((accountAddress) => [
        accountAddress.toLowerCase(),
        accountAddress,
      ]),
    );
    lowercaseAddressIndexCache.set(accounts, index);
  }
  return index;
};

/**
 * Returns the native balance (hex wei) of `address` on `chainId`, matching the
 * address case-insensitively within that chain only. The lowercase address
 * index is cached per chain accounts object, so unrelated store updates do not
 * re-scan the chain's accounts.
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

  const accountKey = Object.prototype.hasOwnProperty.call(accounts, address)
    ? address
    : getLowercaseAddressIndex(accounts).get(address.toLowerCase());

  return (accountKey && accounts[accountKey]?.balance) || '0x0';
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
