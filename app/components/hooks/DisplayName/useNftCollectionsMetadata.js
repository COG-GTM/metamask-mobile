

import { useAsyncResult } from '../useAsyncResult';
import Engine from '../../../core/Engine';
import { getTokenDetails } from '../../../util/address';

export let TokenStandard = /*#__PURE__*/function (TokenStandard) {TokenStandard["erc20"] = "ERC20";TokenStandard["erc721"] = "ERC721";TokenStandard["erc1155"] = "ERC1155";return TokenStandard;}({});










// For now, we only support ERC721 tokens
const SUPPORTED_NFT_TOKEN_STANDARDS = [TokenStandard.erc721];

export function useNftCollectionsMetadata(
requests)
{
  const { value: collectionsMetadata } = useAsyncResult(
    () => fetchCollections(requests),
    [JSON.stringify(requests)]
  );

  return collectionsMetadata ?? {};
}

async function fetchCollections(requests) {
  const valuesByChainId = requests.reduce(
    (acc, { chainId, contractAddress }) => {
      acc[chainId] = [...(acc[chainId] ?? []), contractAddress.toLowerCase()];
      return acc;
    },
    {}
  );

  const chainIds = Object.keys(valuesByChainId);

  const responses = await Promise.all(
    chainIds.map((chainId) => {
      const contractAddresses = valuesByChainId[chainId];
      return fetchCollectionsForChain(contractAddresses, chainId);
    })
  );

  return chainIds.reduce(
    (acc, chainId, index) => {
      acc[chainId] = responses[index];
      return acc;
    },
    {}
  );
}

async function fetchCollectionsForChain(
contractAddresses,
chainId)
{
  const { NftController } = Engine.context;

  const contractStandardsResponses = await Promise.all(
    contractAddresses.map((contractAddress) =>
    getTokenDetails(contractAddress, chainId)
    )
  );

  const supportedNFTContracts = contractAddresses.filter(
    (_contractAddress, index) =>
    SUPPORTED_NFT_TOKEN_STANDARDS.includes(
      contractStandardsResponses[index].standard
    )
  );

  if (supportedNFTContracts.length === 0) {
    return {};
  }

  const collectionsResult = await NftController.getNFTContractInfo(
    supportedNFTContracts,
    chainId
  );

  const collectionsData = collectionsResult.collections.reduce(

    (acc, collection, index) => {
      acc[supportedNFTContracts[index]] = {
        name: collection?.name,
        image: collection?.image,
        isSpam: collection?.isSpam
      };
      return acc;
    }, {});

  return collectionsData;
}