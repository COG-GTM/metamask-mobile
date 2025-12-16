import { build } from 'eth-url-parser';
import AppConstants from '../core/AppConstants';
import { getDecimalChainId } from './networks';

export function generateUniversalLinkAddress(address: string): string {
  return `https://${AppConstants.MM_UNIVERSAL_LINK_HOST}/send/${address}`;
}

export function generateUniversalLinkRequest(ethereum_link: string): string {
  const universal_link_format = `https://${AppConstants.MM_UNIVERSAL_LINK_HOST}/send/`;
  return ethereum_link.replace('ethereum:', universal_link_format);
}

export function generateETHLink(receiverAddress: string, value: string, chainId: string): string {
  const data = {
    chain_id: getDecimalChainId(chainId),
    function_name: undefined,
    parameters: {
      value,
    },
    scheme: 'ethereum',
    target_address: receiverAddress,
  };
  return build(data);
}

export function generateERC20Link(
  receiverAddress: string,
  assetAddress: string,
  value: string,
  chainId: string,
): string {
  const data = {
    chain_id: getDecimalChainId(chainId),
    function_name: 'transfer',
    parameters: {
      address: receiverAddress,
      uint256: value,
    },
    scheme: 'ethereum',
    target_address: assetAddress,
  };
  return build(data);
}
