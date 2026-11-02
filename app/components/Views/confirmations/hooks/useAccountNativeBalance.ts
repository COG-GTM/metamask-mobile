import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { RootState } from '../../../../reducers';
import { selectNativeBalanceByChainIdAndAddress } from '../../../../selectors/accountTrackerController';

export const useAccountNativeBalance = (chainId: Hex, address: string) => {
  const selectBalance = useCallback(
    (state: RootState) =>
      selectNativeBalanceByChainIdAndAddress(state, chainId, address),
    [chainId, address],
  );

  const balanceWeiInHex = useSelector(selectBalance);

  return {
    balanceWeiInHex,
  };
};
