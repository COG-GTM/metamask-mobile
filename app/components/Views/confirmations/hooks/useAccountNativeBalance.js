import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAccountsByChainId } from '../../../../selectors/accountTrackerController';







export const useAccountNativeBalance = (chainId, address) => {
  const accountsByChainId = useSelector(selectAccountsByChainId);

  // Create a normalized version of accountsByChainId with lowercase addresses
  const normalizedAccountsByChainId = useMemo(() => {
    if (!accountsByChainId) return {};
    return Object.entries(accountsByChainId).reduce(
      (acc, [chainIdKey, accounts]) => {
        acc[chainIdKey] = Object.entries(accounts).reduce(

          (chainAcc, [acctAddress, acctData]) => {
            chainAcc[acctAddress.toLowerCase()] = acctData;
            return chainAcc;
          }, {});
        return acc;
      },
      {}
    );
  }, [accountsByChainId]);

  if (!chainId || !address) {
    return {
      balanceWeiInHex: '0x0'
    };
  }

  const lowercaseAddress = address.toLowerCase();

  const rawAccountBalance =
  normalizedAccountsByChainId[chainId]?.[lowercaseAddress]?.balance ?? '0x0';

  return {
    balanceWeiInHex: rawAccountBalance
  };
};