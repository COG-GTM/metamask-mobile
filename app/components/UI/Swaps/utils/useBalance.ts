import { useMemo } from 'react';
import { isSwapsNativeAsset } from '.';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';
import type { Account, Balances, Token } from './token-list-utils';

function useBalance(
  accounts: Record<string, Account>,
  balances: Balances,
  selectedAddress: string,
  sourceToken: Token | undefined,
  { asUnits = false }: { asUnits?: boolean } = {},
): string | ReturnType<typeof safeNumberToBN> | null {
  // TODO: This doesn't always return type BN. Objects down the line may attempt to call functions on the BN object.
  const balance = useMemo(() => {
    if (!sourceToken) {
      return null;
    }
    if (isSwapsNativeAsset(sourceToken)) {
      if (asUnits) {
        // Controller stores balances in hex for ETH
        return safeNumberToBN(
          // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
          (accounts[selectedAddress] && accounts[selectedAddress].balance) || 0,
        );
      }
      return renderFromWei(
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        accounts[selectedAddress] && accounts[selectedAddress].balance,
      );
    }
    const tokenAddress = safeToChecksumAddress(sourceToken.address) as string;

    if (tokenAddress in balances) {
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
