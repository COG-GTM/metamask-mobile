import { useMemo } from 'react';
import type BN4 from 'bnjs4';
import { isSwapsNativeAsset } from '.';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';

interface AccountWithBalance {
  balance: string;
}

interface BalanceSourceToken {
  address: string;
  decimals: number;
}

function useBalance(
  accounts: Record<string, AccountWithBalance>,
  balances: Record<string, string>,
  selectedAddress: string | undefined,
  sourceToken?: BalanceSourceToken | null,
  { asUnits = false }: { asUnits?: boolean } = {},
): BN4 | string | null {
  const balance = useMemo(() => {
    if (!sourceToken) {
      return null;
    }
    if (isSwapsNativeAsset(sourceToken)) {
      if (asUnits) {
        // Controller stores balances in hex for ETH
        return safeNumberToBN(
          accounts[selectedAddress ?? '']?.balance || 0,
        ) as BN4;
      }
      return renderFromWei(accounts[selectedAddress ?? '']?.balance);
    }
    const tokenAddress = safeToChecksumAddress(sourceToken.address);

    if (tokenAddress && tokenAddress in balances) {
      if (asUnits) {
        return balances[tokenAddress];
      }
      return renderFromTokenMinimalUnit(
        balances[tokenAddress],
        sourceToken.decimals,
      );
    }
    return safeNumberToBN(0) as BN4;
  }, [accounts, asUnits, balances, selectedAddress, sourceToken]);

  return balance;
}

export default useBalance;
