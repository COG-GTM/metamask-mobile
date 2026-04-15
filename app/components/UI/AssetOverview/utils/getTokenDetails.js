import { zeroAddress } from 'ethereumjs-util';



export const getTokenDetails = (
asset,
isEvmNetworkSelected,
tokenContractAddress,
tokenMetadata) =>
{
  if (!isEvmNetworkSelected) {
    return {
      contractAddress: asset.address || null,
      tokenDecimal: asset.decimals || null,
      tokenList: asset.aggregators.join(', ') || null
    };
  }

  if (asset.isETH) {
    return {
      contractAddress: zeroAddress(),
      tokenDecimal: 18,
      tokenList: ''
    };
  }

  return {
    contractAddress: tokenContractAddress ?? null,
    tokenDecimal:
    typeof tokenMetadata?.decimals === 'number' ?
    tokenMetadata.decimals :
    null,
    tokenList: Array.isArray(tokenMetadata?.aggregators) ?
    tokenMetadata.aggregators.join(', ') :
    null
  };
};