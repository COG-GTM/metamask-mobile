// Third party dependencies.
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';

// External Dependencies.
import { doENSReverseLookup } from '../../../util/ENSUtils';
import { selectChainId } from '../../../selectors/networkController';
import { selectIsMultiAccountBalancesEnabled } from '../../../selectors/preferencesController';
import {
  selectInternalAccounts,
  selectSelectedInternalAccount,
} from '../../../selectors/accountsController';

// Internal dependencies
import {
  Account,
  EnsByAccountAddress,
  UseAccounts,
  UseAccountsParams,
} from './useAccounts.types';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  getFormattedAddressFromInternalAccount,
  isNonEvmAddress,
} from '../../../core/Multichain/utils';
import { useMultichainBalancesForAllAccounts } from '../useMultichainBalances';

const ENS_LOOKUP_CONCURRENCY = 4;

/**
 * Hook that returns both wallet accounts and ens name information.
 *
 * @returns Object that contains both wallet accounts and ens name information.
 */
const useAccounts = ({
  checkBalanceError: checkBalanceErrorFn,
  isLoading = false,
}: UseAccountsParams = {}): UseAccounts => {
  const isMountedRef = useRef(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [evmAccounts, setEVMAccounts] = useState<Account[]>([]);
  const [ensByAccountAddress, setENSByAccountAddress] =
    useState<EnsByAccountAddress>({});
  const chainId = useSelector(selectChainId);
  const internalAccounts = useSelector(selectInternalAccounts);
  const selectedInternalAccount = useSelector(selectSelectedInternalAccount);

  const { multichainBalancesForAllAccounts } =
    useMultichainBalancesForAllAccounts();

  const isMultiAccountBalancesEnabled = useSelector(
    selectIsMultiAccountBalancesEnabled,
  );
  const checkBalanceError = useCallback(
    (balance: string) => checkBalanceErrorFn?.(balance),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  // Memoize the balance calculation to prevent it from causing re-renders
  const accountBalances = useMemo(() => {
    const balances: Record<
      string,
      {
        displayBalance: string;
        balanceError: string | undefined;
      }
    > = {};

    internalAccounts.forEach((account) => {
      const balanceForAccount = multichainBalancesForAllAccounts?.[account.id];
      const displayBalance = balanceForAccount
        ? `${balanceForAccount.displayBalance}\n${balanceForAccount.totalNativeTokenBalance} ${balanceForAccount.nativeTokenUnit}`
        : '';

      const error =
        balanceForAccount.totalFiatBalance !== undefined
          ? checkBalanceError?.(balanceForAccount.totalFiatBalance.toString())
          : undefined;

      balances[account.id] = {
        displayBalance,
        balanceError: typeof error === 'string' ? error : undefined,
      };
    });

    return balances;
  }, [internalAccounts, multichainBalancesForAllAccounts, checkBalanceError]);

  const getAccounts = useCallback(() => {
    if (!isMountedRef.current) return;
    // Keep track of the Y position of account item. Used for scrolling purposes.
    let yOffset = 0;
    const flattenedAccounts: Account[] = internalAccounts.map(
      (internalAccount: InternalAccount) => {
        const formattedAddress =
          getFormattedAddressFromInternalAccount(internalAccount);
        const isSelected =
          selectedInternalAccount?.address === internalAccount.address;

        const accountBalance = accountBalances[internalAccount.id] || {
          displayBalance: '',
          balanceError: undefined,
        };

        const isBalanceAvailable = isMultiAccountBalancesEnabled || isSelected;
        const mappedAccount: Account = {
          name: internalAccount.metadata.name,
          address: formattedAddress,
          type: internalAccount.metadata.keyring.type as KeyringTypes,
          yOffset,
          isSelected,
          // TODO - Also fetch assets. Reference AccountList component.
          // assets
          assets:
            isBalanceAvailable && accountBalance.displayBalance
              ? {
                  fiatBalance: accountBalance.displayBalance,
                }
              : undefined,
          balanceError: accountBalance.balanceError,
        };
        // Calculate height of the account item.
        yOffset += 78;
        if (accountBalance.balanceError) {
          yOffset += 22;
        }
        if (internalAccount.metadata.keyring.type !== KeyringTypes.hd) {
          yOffset += 24;
        }
        return mappedAccount;
      },
    );

    setAccounts(flattenedAccounts);
    setEVMAccounts(
      flattenedAccounts.filter((account) => !isNonEvmAddress(account.address)),
    );
  }, [
    internalAccounts,
    selectedInternalAccount?.address,
    accountBalances, // Use the memoized balances instead of multichainBalancesForAllAccounts
    isMultiAccountBalancesEnabled,
  ]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
    }
    if (isLoading) return;
    getAccounts();
    return () => {
      isMountedRef.current = false;
    };
  }, [getAccounts, isLoading]);

  // ENS names only depend on the chain and the account addresses, so balance
  // updates must not trigger new lookups.
  const ensLookupAddressesKey = useMemo(
    () =>
      internalAccounts
        .map(getFormattedAddressFromInternalAccount)
        .filter((address) => !isNonEvmAddress(address))
        .join(','),
    [internalAccounts],
  );
  const selectedAddressRef = useRef<string | undefined>();
  selectedAddressRef.current = selectedInternalAccount?.address;

  useEffect(() => {
    if (isLoading || !ensLookupAddressesKey) return;
    let isCancelled = false;
    const addresses = ensLookupAddressesKey.split(',');
    const selectedAddress = selectedAddressRef.current?.toLowerCase();
    const startingIndex = Math.max(
      addresses.findIndex(
        (address) => address.toLowerCase() === selectedAddress,
      ),
      0,
    );
    // Look up the selected account first, then walk outwards from it.
    const orderedAddresses: string[] = [];
    for (
      let after = startingIndex, before = startingIndex - 1;
      after < addresses.length || before >= 0;
      after++, before--
    ) {
      if (after < addresses.length) orderedAddresses.push(addresses[after]);
      if (before >= 0) orderedAddresses.push(addresses[before]);
    }

    const latestENSbyAccountAddress: EnsByAccountAddress = {};
    let hasChanges = false;
    let nextIndex = 0;
    const lookupNext = async (): Promise<void> => {
      while (nextIndex < orderedAddresses.length) {
        if (isCancelled) return;
        const address = orderedAddresses[nextIndex++];
        try {
          const ens: string | undefined = await doENSReverseLookup(
            address,
            chainId,
          );
          if (ens) {
            latestENSbyAccountAddress[address] = ens;
            hasChanges = true;
          }
        } catch (e) {
          // ENS either doesn't exist or failed to fetch.
        }
      }
    };

    Promise.all(
      Array.from(
        { length: Math.min(ENS_LOOKUP_CONCURRENCY, orderedAddresses.length) },
        lookupNext,
      ),
    ).then(() => {
      if (hasChanges && !isCancelled) {
        setENSByAccountAddress((prevState) => ({
          ...prevState,
          ...latestENSbyAccountAddress,
        }));
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [chainId, ensLookupAddressesKey, isLoading]);

  return {
    accounts,
    evmAccounts,
    ensByAccountAddress,
  };
};

export default useAccounts;
