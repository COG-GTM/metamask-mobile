
import { useSelector } from 'react-redux';
import { fetchAssetMetadata, getAssetImageUrl } from './utils';
import { useAsyncResult } from '../../../../hooks/useAsyncResult';
import { selectBasicFunctionalityEnabled } from '../../../../../selectors/settings';
import { isAddress as isSolanaAddress } from '@solana/addresses';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';

export let AssetType = /*#__PURE__*/function (AssetType) {
  /** The native asset for the current network, such as ETH */AssetType["native"] = "NATIVE";

  /** An ERC20 token */AssetType["token"] = "TOKEN";

  /** An ERC721 or ERC1155 token. */AssetType["NFT"] = "NFT";

  /**
   * A transaction interacting with a contract that isn't a token method
   * interaction will be marked as dealing with an unknown asset type.
   */AssetType["unknown"] = "UNKNOWN";return AssetType;}({});



/**
 * Fetches token metadata for a single token if searchQuery is defined but filteredTokenList is empty
 * There is no minimum age of token that can be queried for. The Token API has a fallback mechanism that will look up tokens it does not have saved.
 *
 * @param searchQuery - The search query to fetch metadata for
 * @param shouldFetchMetadata - Whether to fetch metadata
 * @param chainId - The chain id to fetch metadata for
 * @returns The asset metadata
 */
export const useAssetMetadata = (
searchQuery,
shouldFetchMetadata,
chainId) =>
{
  const isBasicFunctionalityEnabled = useSelector(
    selectBasicFunctionalityEnabled
  );

  const { value: assetMetadata, pending } = useAsyncResult(












    async () => {
      if (!chainId || !searchQuery) {
        return undefined;
      }

      const trimmedSearchQuery = searchQuery.trim();
      const isAddress =
      isSolanaAddress(trimmedSearchQuery) || isEvmAddress(trimmedSearchQuery);

      if (isBasicFunctionalityEnabled && shouldFetchMetadata && isAddress) {
        const metadata = await fetchAssetMetadata(trimmedSearchQuery, chainId);

        if (metadata) {
          return {
            ...metadata,
            chainId,
            isNative: false,
            type: AssetType.token,
            image: getAssetImageUrl(metadata.assetId, chainId) ?? '',
            balance: '',
            string: ''
          };
        }
        return undefined;
      }
      return undefined;
    }, [shouldFetchMetadata, searchQuery]);

  return { assetMetadata, pending };
};