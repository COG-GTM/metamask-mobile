import { useMemo } from 'react';
import { isSwapsNativeAsset } from '.';
import type { Token } from './token-list-utils';
import BN4 from 'bnjs4';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';

interface Account {
  balance?: string | number;
}

type Accounts = Record<string, Account | undefined>;
type Balances = Record<string, string | BN4>;

interface UseBalanceOptions {
  asUnits?: boolean;
}

function useBalance(
  accounts: Accounts,
  balances: Balances,
  selectedAddress: string,
  sourceToken: Pick<Token, 'address' | 'decimals'> | null | undefined,
  { asUnits = false }: UseBalanceOptions = {},
):
  | string
  | BN4
  | null {
  // TODO: This doesn't always return type BN. Objects down the line may attempt to call functions on the BN object.
  const balance = useMemo((): string | BN4 | null => {
    if (!sourceToken) {
      return null;
    }
    if (isSwapsNativeAsset(sourceToken)) {
      if (asUnits) {
        // Controller stores balances in hex for ETH
        return safeNumberToBN(accounts[selectedAddress]?.balance ?? 0) as BN4;
      }
      return renderFromWei(accounts[selectedAddress]?.balance ?? 0);
    }
    const tokenAddress = safeToChecksumAddress(sourceToken.address);
    if (!tokenAddress) {
      return safeNumberToBN(0) as BN4;
    }

    if (tokenAddress in balances) {
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
