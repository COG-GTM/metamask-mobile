/* eslint-disable @typescript-eslint/prefer-optional-chain */
import { useMemo } from 'react';
import { isSwapsNativeAsset, SwapsToken } from '.';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';
import { BN } from 'ethereumjs-util';

interface UseBalanceOptions {
  asUnits?: boolean;
}

function useBalance(
  accounts: Record<string, { balance: string }>,
  balances: Record<string, string>,
  selectedAddress: string,
  sourceToken: SwapsToken | null | undefined,
  { asUnits = false }: UseBalanceOptions = {},
): string | BN | null {
  // TODO: This doesn't always return type BN. Objects down the line may attempt to call functions on the BN object.
  const balance: string | BN | null = useMemo(() => {
    if (!sourceToken) {
      return null;
    }
    if (isSwapsNativeAsset(sourceToken)) {
      if (asUnits) {
        // Controller stores balances in hex for ETH
        return safeNumberToBN(
          (accounts[selectedAddress] && accounts[selectedAddress].balance) || 0,
        ) as BN;
      }
      return renderFromWei(
        accounts[selectedAddress] && accounts[selectedAddress].balance,
      );
    }
    const tokenAddress = safeToChecksumAddress(sourceToken.address);

    if (tokenAddress && tokenAddress in balances) {
      if (asUnits) {
        return balances[tokenAddress as string];
      }
      return renderFromTokenMinimalUnit(
        balances[tokenAddress as string],
        sourceToken.decimals,
      );
    }
    return safeNumberToBN(0) as BN;
  }, [accounts, asUnits, balances, selectedAddress, sourceToken]);

  return balance;
}

export default useBalance;
