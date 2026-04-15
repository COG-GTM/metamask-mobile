


import { TokenStandard } from '../../../UI/SimulationDetails/types';
import { useAsyncResult } from '../../../hooks/useAsyncResult';
import {
  ERC20_DEFAULT_DECIMALS,
  parseTokenDetailDecimals,
  memoizedGetTokenStandardAndDetails } from

'../utils/token';
import { useRef } from 'react';

/**
 * Returns token details for a given token contract
 *
 * @param tokenAddress
 * @returns
 */
export const useGetTokenStandardAndDetails = (
tokenAddress,
networkClientId) =>
{
  const isPendingRef = useRef(false);

  const { value: details } =
  useAsyncResult(async () => {
    if (!tokenAddress) {
      return Promise.resolve(null);
    }

    isPendingRef.current = true;

    const result = await memoizedGetTokenStandardAndDetails({
      tokenAddress,
      networkClientId
    });
    isPendingRef.current = false;

    return result;
  }, [tokenAddress]);

  if (!details) {
    return { details: { decimalsNumber: undefined }, isPending: isPendingRef.current };
  }

  const { decimals, standard } = details || {};

  if (standard === TokenStandard.ERC20) {
    const parsedDecimals =
    parseTokenDetailDecimals(decimals) ?? ERC20_DEFAULT_DECIMALS;
    details.decimalsNumber = parsedDecimals;
  }

  return { details, isPending: isPendingRef.current };
};