import { useMemo } from 'react';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';
import { isSwapsNativeAsset, SwapsToken } from '.';

function useBalance(
  accounts: Record<string, { balance?: string } | undefined>,
  balances: Record<string, string>,
  selectedAddress: string,
  sourceToken?: SwapsToken | null,
  { asUnits = false }: { asUnits?: boolean } = {},
) {
  // TODO: This doesn't always return type BN. Objects down the line may attempt to call functions on the BN object.
  const balance = useMemo(() => {
    if (!sourceToken) {
      return null;
    }
    if (isSwapsNativeAsset(sourceToken)) {
      const nativeBalance = accounts[selectedAddress]?.balance;
      if (asUnits) {
        // Controller stores balances in hex for ETH
        return safeNumberToBN(nativeBalance || 0);
      }
      return renderFromWei(nativeBalance ?? '0');
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
