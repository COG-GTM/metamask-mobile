import { useMemo } from 'react';
import { isSwapsNativeAsset } from '.';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
  safeNumberToBN,
} from '../../../../util/number';
import { safeToChecksumAddress } from '../../../../util/address';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useBalance(
  accounts: any,
  balances: any,
  selectedAddress: string,
  sourceToken: any,
  { asUnits = false } = {},
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
          (accounts[selectedAddress] && accounts[selectedAddress].balance) || 0,
        );
      }
      return renderFromWei(
        accounts[selectedAddress] && accounts[selectedAddress].balance,
      );
    }
    const tokenAddress = safeToChecksumAddress(sourceToken.address);

    // @ts-expect-error Legacy JS code needs type refinement
    if (tokenAddress in balances) {
      if (asUnits) {
        // @ts-expect-error Legacy JS code needs type refinement
        return balances[tokenAddress];
      }
      return renderFromTokenMinimalUnit(
        // @ts-expect-error Legacy JS code needs type refinement
        balances[tokenAddress],
        sourceToken.decimals,
      );
    }
    return safeNumberToBN(0);
  }, [accounts, asUnits, balances, selectedAddress, sourceToken]);

  return balance;
}

export default useBalance;
