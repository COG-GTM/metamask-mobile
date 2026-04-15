import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectHDKeyrings } from '../../selectors/keyringController';
import { selectInternalAccounts } from '../../selectors/accountsController';


// TODO: Move this data type to the @metamask/keyring-controller module


/**
 * Custom hook that combines HD keyrings with their snap accounts that were derived from the same entropy source.
 *
 * @returns An array of hd keyring objects with any snap accounts that were derived from the same entropy source.
 */
export const useHdKeyringsWithSnapAccounts = () => {
  const hdKeyrings = useSelector(selectHDKeyrings);
  const internalAccounts = useSelector(selectInternalAccounts);
  return useMemo(() => {
    const accountsByEntropySource = new Map();
    internalAccounts.forEach((account) => {
      const entropySource = account.options?.entropySource;


      if (entropySource) {
        if (!accountsByEntropySource.has(entropySource)) {
          accountsByEntropySource.set(entropySource, []);
        }
        accountsByEntropySource.get(entropySource)?.push(account.address);
      }
    });

    return hdKeyrings.map((keyring) => {
      const firstPartySnapAccounts =
      accountsByEntropySource.get(keyring.metadata.id) || [];

      return {
        ...keyring,
        accounts: [...keyring.accounts, ...firstPartySnapAccounts]
      };
    });
  }, [hdKeyrings, internalAccounts]);
};