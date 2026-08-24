import { useMemo } from 'react';
import { isSwapsNativeAsset } from '.';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';

interface AccountInformation {
  balance: string;
}

interface SourceToken {
  address: string;
  decimals: number;
}

interface UseBalanceOptions {
  asUnits?: boolean;
}

function useBalance(
  accounts: Record<string, AccountInformation>,
  balances: Record<string, string>,
  selectedAddress: string,
  sourceToken?: SourceToken | null,
  { asUnits = false }: UseBalanceOptions = {},
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
    const tokenAddress = safeToChecksumAddress(sourceToken.address);

    if ((tokenAddress as string) in balances) {
      if (asUnits) {
        return balances[tokenAddress as string];
      }
      return renderFromTokenMinimalUnit(
        balances[tokenAddress as string],
        sourceToken.decimals,
      );
    }
    return safeNumberToBN(0);
  }, [accounts, asUnits, balances, selectedAddress, sourceToken]);

  return balance;
}

export default useBalance;
