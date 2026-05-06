import { useMemo } from 'react';
import BN from 'bn.js';
import { isSwapsNativeAsset, SwapsTokenLike } from '.';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';

interface AccountBalance {
  balance?: string;
  [key: string]: unknown;
}

type AccountsByAddress = Record<string, AccountBalance | undefined>;
type BalancesByAddress = Record<string, BN | string | undefined>;

type Balance = BN | string | null;

interface UseBalanceOptions {
  asUnits?: boolean;
}

function useBalance(
  accounts: AccountsByAddress,
  balances: BalancesByAddress,
  selectedAddress: string,
  sourceToken: SwapsTokenLike | null | undefined,
  { asUnits = false }: UseBalanceOptions = {},
): Balance {
  // TODO: This doesn't always return type BN. Objects down the line may attempt to call functions on the BN object.
  const balance = useMemo<Balance>(() => {
    if (!sourceToken) {
      return null;
    }
    if (isSwapsNativeAsset(sourceToken)) {
      if (asUnits) {
        // Controller stores balances in hex for ETH
        return safeNumberToBN(
          (accounts[selectedAddress] && accounts[selectedAddress]?.balance) ||
            0,
        ) as unknown as BN;
      }
      return renderFromWei(
        (accounts[selectedAddress] && accounts[selectedAddress]?.balance) ||
          0,
      );
    }
    const tokenAddress = safeToChecksumAddress(sourceToken.address ?? '');

    if (tokenAddress && tokenAddress in balances) {
      const tokenBalance = balances[tokenAddress];
      if (asUnits) {
        return (tokenBalance as BN | string) ?? null;
      }
      return renderFromTokenMinimalUnit(
        (tokenBalance ?? 0) as unknown as string | number,
        sourceToken.decimals ?? 0,
      );
    }
    return safeNumberToBN(0) as unknown as BN;
  }, [accounts, asUnits, balances, selectedAddress, sourceToken]);

  return balance;
}

export default useBalance;
