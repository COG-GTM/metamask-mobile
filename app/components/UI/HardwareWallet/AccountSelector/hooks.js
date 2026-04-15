import { useState, useMemo, useEffect } from 'react';
import Engine from '../../../../core/Engine';













export const useAccountsBalance = (accounts) => {
  const [trackedAccounts, setTrackedAccounts] = useState({});
  const AccountTrackerController = useMemo(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => Engine.context.AccountTrackerController,
    []
  );

  useEffect(
    () => {
      const unTrackedAccounts = [];
      accounts.forEach((account) => {
        if (!trackedAccounts[account.address]) {
          unTrackedAccounts.push(account.address);
        }
      });
      if (unTrackedAccounts.length > 0) {
        AccountTrackerController.syncBalanceWithAddresses(
          unTrackedAccounts
        ).then((_trackedAccounts) => {
          setTrackedAccounts({
            ...trackedAccounts,
            ..._trackedAccounts
          });
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [AccountTrackerController, accounts]
  );

  return trackedAccounts;
};