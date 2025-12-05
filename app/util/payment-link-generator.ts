import { build, BuildInput } from 'eth-url-parser';
import AppConstants from '../core/AppConstants';
import { getDecimalChainId } from './networks';

/**
 * Generate a universal link / app link based on EIP-681 / EIP-831 URLs
 *
 * @param address - Ethereum address
 * @returns Payment request universal link / app link
 */
export function generateUniversalLinkAddress(address: string): string {
  return `https://${AppConstants.MM_UNIVERSAL_LINK_HOST}/send/${address}`;
}

/**
 * Generate a universal link / app link based on EIP-681 / EIP-831 URLs
 *
 * @param ethereum_link - EIP-681 / EIP-831 compatible url
 * @returns Payment request universal link / app link
 */
export function generateUniversalLinkRequest(ethereum_link: string): string {
  const universal_link_format = `https://${AppConstants.MM_UNIVERSAL_LINK_HOST}/send/`;
  return ethereum_link.replace('ethereum:', universal_link_format);
}

/**
 * Generate ETH payment request link
 *
 * @param receiverAddress - Receiver address
 * @param value - Value to request, in float number
 * @param chainId - Chain id
 * @returns Payment request link, it could throw if errors are found
 */
export function generateETHLink(
  receiverAddress: string,
  value: string,
  chainId: string,
): string {
  const data: BuildInput = {
    chain_id: getDecimalChainId(chainId) as `${number}`,
    function_name: undefined,
    parameters: {
      value,
    },
    target_address: receiverAddress,
  };
  return build(data);
}

/**
 * Generate ERC asset payment request link
 *
 * @param receiverAddress - Receiver address
 * @param assetAddress - ERC20 asset address
 * @param value  - Value to request, in float number
 * @param chainId - Chain id
 * @returns Payment request link, it could throw if errors are found
 */
export function generateERC20Link(
  receiverAddress: string,
  assetAddress: string,
  value: string,
  chainId: string,
): string {
  const data: BuildInput = {
    chain_id: getDecimalChainId(chainId) as `${number}`,
    function_name: 'transfer',
    parameters: {
      address: receiverAddress,
      uint256: value,
    },
    target_address: assetAddress,
  };
  return build(data);
}
