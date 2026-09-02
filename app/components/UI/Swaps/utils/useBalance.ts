import { useMemo } from 'react';
import { isSwapsNativeAsset } from '.';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';

interface Account {
  balance?: string;
}

interface SourceToken {
  address: string;
  decimals: number;
}

interface BalanceOptions {
  asUnits?: boolean;
}

interface BalanceValue {
  toString(radix?: number): string;
}

function useBalance(
  accounts: Record<string, Account>,
  balances: Record<string, string>,
  selectedAddress: string,
  sourceToken: SourceToken | null | undefined,
  options: { asUnits: true },
): BalanceValue | null;
function useBalance(
  accounts: Record<string, Account>,
  balances: Record<string, string>,
  selectedAddress: string,
  sourceToken?: SourceToken | null,
  options?: BalanceOptions,
): BalanceValue | null;
function useBalance(
  accounts: Record<string, Account>,
  balances: Record<string, string>,
  selectedAddress: string,
  sourceToken?: SourceToken | null,
  { asUnits = false } = {},
): BalanceValue | null {
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
      return renderFromWei(
        accounts[selectedAddress]?.balance || '0',
      ) as unknown as BalanceValue;
    }
    const tokenAddress = safeToChecksumAddress(sourceToken.address);

    if (tokenAddress && tokenAddress in balances) {
      if (asUnits) {
        return balances[tokenAddress] as unknown as BalanceValue;
      }
      return renderFromTokenMinimalUnit(
        balances[tokenAddress],
        sourceToken.decimals,
      ) as unknown as BalanceValue;
    }
    return safeNumberToBN(0);
  }, [accounts, asUnits, balances, selectedAddress, sourceToken]);

  return balance;
}

export default useBalance;
