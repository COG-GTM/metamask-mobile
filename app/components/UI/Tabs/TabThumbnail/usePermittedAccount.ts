import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../reducers';
import { selectPermissionControllerState } from '../../../../selectors/snaps/permissionController';
import { selectInternalAccounts } from '../../../../selectors/accountsController';
import { getAccountsFromSubject } from '../../../../core/Permissions';
import {
  getFormattedAddressFromInternalAccount,
  isNonEvmAddress,
} from '../../../../core/Multichain/utils';

export interface PermittedAccount {
  name: string;
  address: string;
}

/**
 * Returns the first EVM account permitted for the given hostname, if any.
 * Reads only the hostname's permission subject and the internal accounts
 * list, so it does no balance aggregation or ENS lookups.
 */
const usePermittedAccount = (
  hostname: string,
): PermittedAccount | undefined => {
  const subject = useSelector((state: RootState) => {
    const subjects = selectPermissionControllerState(state)?.subjects;
    return subjects && Object.prototype.hasOwnProperty.call(subjects, hostname)
      ? subjects[hostname]
      : undefined;
  });
  const internalAccounts = useSelector(selectInternalAccounts);

  return useMemo(() => {
    if (!subject) return undefined;
    const activeAddress: string | undefined =
      getAccountsFromSubject(subject)[0];
    if (!activeAddress) return undefined;

    const lowercasedAddress = activeAddress.toLowerCase();
    for (const internalAccount of internalAccounts) {
      if (internalAccount.address.toLowerCase() !== lowercasedAddress) {
        continue;
      }
      const address = getFormattedAddressFromInternalAccount(internalAccount);
      if (isNonEvmAddress(address)) continue;
      return { name: internalAccount.metadata.name, address };
    }
    return undefined;
  }, [subject, internalAccounts]);
};

export default usePermittedAccount;
