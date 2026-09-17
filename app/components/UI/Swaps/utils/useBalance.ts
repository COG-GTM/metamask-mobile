import { useMemo } from 'react';
import { isSwapsNativeAsset, SwapsViewToken } from '.';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';

interface SwapsAccountBalance {
  balance?: string;
}

type SwapsAccounts = Record<string, SwapsAccountBalance>;
type SwapsBalances = Record<string, string>;

interface UseBalanceOptions {
  asUnits?: boolean;
}

function useBalance(
  accounts: SwapsAccounts,
  balances: SwapsBalances,
  selectedAddress: string,
  sourceToken: SwapsViewToken | null | undefined,
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
        return safeNumberToBN(
          (accounts[selectedAddress]?.balance) || 0,
        );
      }
      return renderFromWei(
        (accounts[selectedAddress]?.balance) ?? '',
      );
    }
    const tokenAddress = safeToChecksumAddress(sourceToken.address);

    if (tokenAddress && tokenAddress in balances) {
      if (asUnits) {
        return balances[tokenAddress];
      }
      return renderFromTokenMinimalUnit(
        balances[tokenAddress],
        sourceToken.decimals ?? 0,
      );
    }
    return safeNumberToBN(0);
  }, [accounts, asUnits, balances, selectedAddress, sourceToken]);

  return balance;
}

export default useBalance;
