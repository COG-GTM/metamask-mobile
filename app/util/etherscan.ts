import {
  LINEA_GOERLI_BLOCK_EXPLORER,
  LINEA_MAINNET_BLOCK_EXPLORER,
  LINEA_SEPOLIA_BLOCK_EXPLORER,
} from '../constants/urls';
import {
  LINEA_GOERLI,
  LINEA_MAINNET,
  LINEA_SEPOLIA,
  MAINNET,
} from '../constants/network';

export function getEtherscanAddressUrl(
  networkType: string,
  address: string,
): string {
  return `${getEtherscanBaseUrl(networkType)}/address/${address}`;
}

export function getEtherscanTransactionUrl(
  networkType: string,
  tx_hash: string,
): string {
  return `${getEtherscanBaseUrl(networkType)}/tx/${tx_hash}`;
}

export function getEtherscanBaseUrl(networkType: string): string {
  if (networkType === LINEA_GOERLI) return LINEA_GOERLI_BLOCK_EXPLORER;
  if (networkType === LINEA_SEPOLIA) return LINEA_SEPOLIA_BLOCK_EXPLORER;
  if (networkType === LINEA_MAINNET) return LINEA_MAINNET_BLOCK_EXPLORER;
  const subdomain =
    networkType.toLowerCase() === MAINNET
      ? ''
      : `${networkType.toLowerCase()}.`;
  return `https://${subdomain}etherscan.io`;
}
