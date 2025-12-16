import { useMemo } from 'react';
import { isSwapsNativeAsset } from '.';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';
import BN from 'bnjs4';

interface Account {
  balance?: string;
  [key: string]: unknown;
}

interface Accounts {
  [address: string]: Account;
}

interface Balances {
  [address: string]: string | BN;
}

interface SourceToken {
  address?: string;
  decimals?: number;
  [key: string]: unknown;
}

interface UseBalanceOptions {
  asUnits?: boolean;
}

function useBalance(
  accounts: Accounts,
  balances: Balances,
  selectedAddress: string,
  sourceToken: SourceToken | null | undefined,
  { asUnits = false }: UseBalanceOptions = {},
): string | BN | null {
  // TODO: This doesn't always return type BN. Objects down the line may attempt to call functions on the BN object.
  const balance = useMemo(() => {
    if (!sourceToken) {
      return null;
    }
    if (isSwapsNativeAsset(sourceToken)) {
      if (asUnits) {
        // Controller stores balances in hex for ETH
        return safeNumberToBN(
          (accounts[selectedAddress] && accounts[selectedAddress].balance) || 0,
        );
      }
      return renderFromWei(
        accounts[selectedAddress] && accounts[selectedAddress].balance,
      );
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
    return safeNumberToBN(0);
  }, [accounts, asUnits, balances, selectedAddress, sourceToken]);

  return balance;
}

export default useBalance;
