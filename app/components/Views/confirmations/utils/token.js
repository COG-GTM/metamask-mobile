import { memoize } from 'lodash';



import { getTokenDetails } from '../../../../util/address';
























export const ERC20_DEFAULT_DECIMALS = 18;

export const parseTokenDetailDecimals = (
decStr) =>
{
  if (!decStr) {
    return undefined;
  }

  for (const radix of [10, 16]) {
    const parsedDec = parseInt(decStr, radix);
    if (isFinite(parsedDec)) {
      return parsedDec;
    }
  }
  return undefined;
};

export const memoizedGetTokenStandardAndDetails = memoize(
  async ({
    tokenAddress,
    tokenId,
    userAddress,
    networkClientId





  }) => {
    try {
      if (!tokenAddress) {
        return {};
      }

      return await getTokenDetails(
        tokenAddress,
        userAddress,
        tokenId,
        networkClientId
      );
    } catch {
      return {};
    }
  }
);

/**
 * Fetches the decimals for the given token address.
 *
 * @param address - The ethereum token contract address. It is expected to be in hex format.
 * We currently accept strings since we have a patch that accepts a custom string
 * {@see .yarn/patches/@metamask-eth-json-rpc-middleware-npm-14.0.1-b6c2ccbe8c.patch}
 */
export const fetchErc20Decimals = async (
address,
networkClientId) =>
{
  try {
    const { decimals: decStr } = await memoizedGetTokenStandardAndDetails({
      tokenAddress: address,
      networkClientId
    });
    const decimals = parseTokenDetailDecimals(decStr);

    return decimals ?? ERC20_DEFAULT_DECIMALS;
  } catch {
    return ERC20_DEFAULT_DECIMALS;
  }
};