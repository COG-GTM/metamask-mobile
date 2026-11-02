import { toChecksumAddress } from 'ethereumjs-util';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectInternalAccounts } from '../../../../selectors/accountsController';
import { renderAccountName } from '../../../../util/address';

const useAccountInfo = (address: string) => {
  const internalAccounts = useSelector(selectInternalAccounts);
  const activeAddress = useMemo(() => toChecksumAddress(address), [address]);

  const accountName = useMemo(
    () =>
      activeAddress ? renderAccountName(activeAddress, internalAccounts) : '',
    [internalAccounts, activeAddress],
  );

  return {
    accountName,
    accountAddress: activeAddress,
  };
};

export default useAccountInfo;
