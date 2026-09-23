import { Nft, NftControllerState } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { isEqual } from 'lodash';

const numberFormatterCache = new Map<string, Intl.NumberFormat>();

/**
 * Returns an `Intl.NumberFormat` instance for the given locale and options,
 * reusing previously created instances since their construction is expensive.
 *
 * @param locale - The locale to format for.
 * @param options - The number format options.
 * @returns The cached formatter.
 */
export const getNumberFormatter = (
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat => {
  const key = `${locale}|${JSON.stringify(options)}`;
  const cached = numberFormatterCache.get(key);
  if (cached) {
    return cached;
  }
  const formatter = new Intl.NumberFormat(locale, options);
  numberFormatterCache.set(key, formatter);
  return formatter;
};

export const formatWithThreshold = (
  amount: number | null,
  threshold: number,
  locale: string,
  options: Intl.NumberFormatOptions,
): string => {
  if (amount === null) {
    return '';
  }
  const formatter = getNumberFormatter(locale, options);
  if (amount === 0) {
    return formatter.format(0);
  }
  return amount < threshold
    ? `<${formatter.format(threshold)}`
    : formatter.format(amount);
};

type AccountNfts = NftControllerState['allNfts'][string]; // Type for NFTs of a single account

const getChainEntries = (state: AccountNfts): [Hex, Nft[]][] =>
  Object.entries(state) as [Hex, Nft[]][];

const isMatchingNft = (nft1: Nft, nft2: Nft) =>
  nft1.address === nft2.address && nft1.tokenId === nft2.tokenId;

/**
 * Compares two NFT states for a single account and returns newly detected NFTs
 * @param previousState - Previous state of NFTs grouped by chainId for a single account
 * @param newState - New state of NFTs grouped by chainId for a single account
 * @returns Array of newly detected NFTs with their respective chainIds
 */
export const compareNftStates = (
  previousState?: AccountNfts,
  newState?: AccountNfts,
): Nft[] => {
  // Return empty array if newState is missing (nothing new to compare)
  if (!newState) return [];

  // Treat undefined/null previousState as empty object (all NFTs will be considered new)
  const prevState = previousState || {};

  return getChainEntries(newState).flatMap(([chainId, newChainNfts]) => {
    const previousChainNfts = prevState[chainId] || [];

    return newChainNfts.filter(
      (newNft) =>
        !previousChainNfts.some((prevNft) => isMatchingNft(prevNft, newNft)),
    );
  });
};

export interface NftAnalyticsParams {
  chain_id: number;
  source: 'detected';
}

/**
 * Compares previous and new NFT states and prepares analytics events for newly detected NFTs
 * @param previousNfts - Previous state of NFTs grouped by chainId for a single account
 * @param newNfts - New state of NFTs grouped by chainId for a single account
 * @param paramBuilder - Function to build analytics parameters for each NFT
 * @returns Array of analytics event params for newly detected NFTs
 */
export const prepareNftDetectionEvents = (
  previousNfts: AccountNfts | undefined,
  newNfts: AccountNfts | undefined,
  paramBuilder: (nft: Nft) => NftAnalyticsParams | undefined,
) => {
  const paramsToSend: NftAnalyticsParams[] = [];
  if (!isEqual(previousNfts, newNfts)) {
    const newlyDetectedNfts = compareNftStates(previousNfts, newNfts);
    newlyDetectedNfts.forEach((nft) => {
      const params = paramBuilder(nft);
      if (params) {
        paramsToSend.push(params);
      }
    });
  }
  return paramsToSend;
};
