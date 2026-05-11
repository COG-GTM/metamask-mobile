import { useMemo } from 'react';
import { isSwapsNativeAsset } from '.';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';

interface AccountBalance {
  balance?: string;
}

interface SourceToken {
  address: string;
  decimals: number;
}

interface UseBalanceOptions {
  asUnits?: boolean;
}

function useBalance(
  accounts: Record<string, AccountBalance>,
  balances: Record<string, unknown>,
  selectedAddress: string,
  sourceToken: SourceToken | null | undefined,
  { asUnits = false }: UseBalanceOptions = {},
) {
  const balance = useMemo(() => {
    if (!sourceToken) {
      return null;
    }
    if (isSwapsNativeAsset(sourceToken)) {
      if (asUnits) {
        return safeNumberToBN(
          (accounts[selectedAddress] && accounts[selectedAddress].balance) || 0,
        );
      }
      return renderFromWei(
        (accounts[selectedAddress] && accounts[selectedAddress].balance) || 0,
      );
    }
    const tokenAddress = safeToChecksumAddress(sourceToken.address);

    if (tokenAddress && tokenAddress in balances) {
      if (asUnits) {
        return balances[tokenAddress];
      }
      return renderFromTokenMinimalUnit(
        balances[tokenAddress] as string,
        sourceToken.decimals,
      );
    }
    return safeNumberToBN(0);
  }, [accounts, asUnits, balances, selectedAddress, sourceToken]);

  return balance;
}

export default useBalance;
