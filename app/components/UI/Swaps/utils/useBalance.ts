import { useMemo } from 'react';
import { Hex } from '@metamask/utils';
import { isSwapsNativeAsset } from '.';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';
import { selectAccounts } from '../../../../selectors/accountTrackerController';
import { selectContractBalances } from '../../../../selectors/tokenBalancesController';

interface UseBalanceToken {
  address: string;
  decimals: number;
}

function useBalance(
  accounts: ReturnType<typeof selectAccounts>,
  balances: ReturnType<typeof selectContractBalances>,
  selectedAddress: string,
  sourceToken: UseBalanceToken | undefined,
  { asUnits = false }: { asUnits?: boolean } = {},
) {
  // TODO: This doesn't always return type BN. Objects down the line may attempt to call functions on the BN object.
  const balance = useMemo(() => {
    if (!sourceToken) {
      return null;
    }
    if (isSwapsNativeAsset(sourceToken)) {
      if (asUnits) {
        // Controller stores balances in hex for ETH
        return safeNumberToBN(accounts[selectedAddress]?.balance || 0);
      }
      return renderFromWei(accounts[selectedAddress]?.balance);
    }
    const tokenAddress = safeToChecksumAddress(sourceToken.address) as Hex;

    if (tokenAddress in balances) {
      if (asUnits) {
        return balances[tokenAddress];
      }
      return renderFromTokenMinimalUnit(
        balances[tokenAddress],
        sourceToken.decimals,
      );
    }
    return safeNumberToBN(0);
  }, [accounts, asUnits, balances, selectedAddress, sourceToken]);

  return balance;
}

export default useBalance;
