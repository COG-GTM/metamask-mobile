// eslint-disable-next-line @typescript-eslint/no-shadow
import URL from 'url-parse';
import networksWithImages from 'images/image-icons';
import {
  MAINNET,
  NETWORKS_CHAIN_ID,
  SEPOLIA,
  RPC,
  LINEA_GOERLI,
  LINEA_MAINNET,
  LINEA_SEPOLIA,
  MEGAETH_TESTNET,
} from '../../../app/constants/network';
import { NetworkSwitchErrorType } from '../../../app/constants/error';
import {
  BlockExplorerUrl,
  ChainId,
  NetworkType,
  toHex,
} from '@metamask/controller-utils';
import { toLowerCaseEquals } from '../general';
import { fastSplit } from '../number';
import { regex } from '../../../app/util/regex';
import { MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP } from '../../../app/core/Multichain/constants';

/* eslint-disable */
const ethLogo = require('../../images/eth-logo-new.png');
const sepoliaLogo = require('../../images/sepolia-logo-dark.png');
const lineaTestnetLogo = require('../../images/linea-testnet-logo.png');
const lineaMainnetLogo = require('../../images/linea-mainnet-logo.png');
const megaEthTestnetLogo = require('../../images/megaeth-testnet-logo.png');

/* eslint-enable */
import {
  PopularList,
  UnpopularNetworkList,
  CustomNetworkImgMapping,
  getNonEvmNetworkImageSourceByChainId,
} from './customNetworks';
import { strings } from '../../../locales/i18n';
import {
  getEtherscanAddressUrl,
  getEtherscanBaseUrl,
  getEtherscanTransactionUrl,
} from '../etherscan';
import {
  LINEA_FAUCET,
  LINEA_MAINNET_BLOCK_EXPLORER,
  LINEA_SEPOLIA_BLOCK_EXPLORER,
  MAINNET_BLOCK_EXPLORER,
  SEPOLIA_BLOCK_EXPLORER,
  SEPOLIA_FAUCET,
} from '../../constants/urls';
import { isNonEvmChainId } from '../../core/Multichain/utils';
import { SolScope } from '@metamask/keyring-api';
import { store } from '../../store';
import {
  selectSelectedNonEvmNetworkChainId,
  selectMultichainNetworkControllerState,
} from '../../selectors/multichainNetworkController';
import {
  formatBlockExplorerAddressUrl,
  type MultichainBlockExplorerFormatUrls,
} from '../../core/Multichain/networks';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { isCaipChainId } from '@metamask/utils';

/**
 * List of the supported networks
 * including name, id, and color
 *
 * This values are used in certain places like
 * navbar and the network switcher.
 */
export const NetworkList = {
  [MAINNET]: {
    name: 'Ethereum Main Network',
    shortName: 'Ethereum',
    networkId: 1,
    chainId: toHex('1'),
    ticker: 'ETH',
    // Third party color
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    color: '#3cc29e',
    networkType: 'mainnet',
    imageSource: ethLogo,
    blockExplorerUrl: MAINNET_BLOCK_EXPLORER,
  },
  [LINEA_MAINNET]: {
    name: 'Linea Main Network',
    shortName: 'Linea',
    networkId: 59144,
    chainId: toHex('59144'),
    ticker: 'ETH',
    // Third party color
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    color: '#121212',
    networkType: 'linea-mainnet',
    imageSource: lineaMainnetLogo,
    blockExplorerUrl: LINEA_MAINNET_BLOCK_EXPLORER,
  },
  [SEPOLIA]: {
    name: 'Sepolia',
    shortName: 'Sepolia',
    networkId: 11155111,
    chainId: toHex('11155111'),
    ticker: 'SepoliaETH',
    // Third party color
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    color: '#cfb5f0',
    networkType: 'sepolia',
    imageSource: sepoliaLogo,
    blockExplorerUrl: SEPOLIA_BLOCK_EXPLORER,
  },
  [LINEA_SEPOLIA]: {
    name: 'Linea Sepolia',
    shortName: 'Linea Sepolia',
    networkId: 59141,
    chainId: toHex('59141'),
    ticker: 'LineaETH',
    // Third party color
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    color: '#61dfff',
    networkType: 'linea-sepolia',
    imageSource: lineaTestnetLogo,
    blockExplorerUrl: LINEA_SEPOLIA_BLOCK_EXPLORER,
  },
  [MEGAETH_TESTNET]: {
    name: 'Mega Testnet',
    shortName: 'Mega Testnet',
    networkId: 6342,
    chainId: toHex('6342'),
    ticker: 'MegaETH',
    // Third party color
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    color: '#61dfff',
    networkType: 'megaeth-testnet',
    imageSource: megaEthTestnetLogo,
    blockExplorerUrl: BlockExplorerUrl['megaeth-testnet'],
  },
  [RPC]: {
    name: 'Private Network',
    shortName: 'Private',
    // Third party color
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    color: '#f2f3f4',
    networkType: 'rpc',
  },
};

const NetworkListKeys = Object.keys(NetworkList);

export const BLOCKAID_SUPPORTED_NETWORK_NAMES = {
  [NETWORKS_CHAIN_ID.MAINNET]: 'Ethereum Mainnet',
  [NETWORKS_CHAIN_ID.BSC]: 'Binance Smart Chain',
  [NETWORKS_CHAIN_ID.BASE]: 'Base',
  [NETWORKS_CHAIN_ID.OPTIMISM]: 'Optimism',
  [NETWORKS_CHAIN_ID.POLYGON]: 'Polygon',
  [NETWORKS_CHAIN_ID.ARBITRUM]: 'Arbitrum',
  [NETWORKS_CHAIN_ID.LINEA_MAINNET]: 'Linea',
  [NETWORKS_CHAIN_ID.SEPOLIA]: 'Sepolia',
  [NETWORKS_CHAIN_ID.OPBNB]: 'opBNB',
  [NETWORKS_CHAIN_ID.ZKSYNC_ERA]: 'zkSync Era Mainnet',
  [NETWORKS_CHAIN_ID.SCROLL]: 'Scroll',
  [NETWORKS_CHAIN_ID.BERACHAIN]: 'Berachain Artio',
  [NETWORKS_CHAIN_ID.METACHAIN_ONE]: 'Metachain One Mainnet',
};

export default NetworkList;

export const getAllNetworks = (): string[] =>
  NetworkListKeys.filter((name) => name !== RPC);

/**
 * Checks if network is default mainnet.
 *
 * @param networkType - Type of network.
 * @returns If the network is default mainnet.
 */
export const isDefaultMainnet = (networkType: string): boolean =>
  networkType === MAINNET;

/**
 * Check whether the given chain ID is Ethereum Mainnet.
 *
 * @param chainId - The chain ID to check.
 * @returns True if the chain ID is Ethereum Mainnet, false otherwise.
 */
export const isMainNet = (chainId: string): boolean => chainId === '0x1';

export const isLineaMainnet = (networkType: string): boolean =>
  networkType === LINEA_MAINNET;
export const isLineaMainnetChainId = (chainId: string): boolean =>
  chainId === CHAIN_IDS.LINEA_MAINNET;

export const isSolanaMainnet = (chainId: string): boolean =>
  chainId === SolScope.Mainnet;

/**
 * Converts a hexadecimal or decimal chain ID to a base 10 number as a string.
 * If the input is in CAIP-2 format (e.g., `eip155:1` or `eip155:137`), the function returns the input string as is.
 *
 * @param chainId - The chain ID to be converted. It can be in hexadecimal, decimal, or CAIP-2 format.
 * @returns - The chain ID converted to a base 10 number as a string, or the original input if it is in CAIP-2 format.
 */
export const getDecimalChainId = (
  chainId: string | undefined,
): string => {
  if (
    !chainId ||
    typeof chainId !== 'string' ||
    !chainId.startsWith('0x') ||
    isNonEvmChainId(chainId)
  ) {
    return chainId as string;
  }
  return parseInt(chainId, 16).toString(10);
};

export const isMainnetByChainId = (chainId: string): boolean =>
  getDecimalChainId(String(chainId)) === String(1);

export const isLineaMainnetByChainId = (chainId: string): boolean =>
  getDecimalChainId(String(chainId)) === String(59144);

export const isMultiLayerFeeNetwork = (chainId: string): boolean =>
  chainId === NETWORKS_CHAIN_ID.OPTIMISM;

/**
 * Gets the test network image icon.
 *
 * @param networkType - Type of network.
 * @returns Image of test network or undefined.
 */
export const getTestNetImage = (
  networkType: string | undefined,
): import('react-native').ImageSourcePropType | undefined => {
  if (
    networkType === SEPOLIA ||
    networkType === LINEA_GOERLI ||
    networkType === LINEA_SEPOLIA
  ) {
    return (
      networksWithImages as Record<
        string,
        import('react-native').ImageSourcePropType
      >
    )?.[networkType.toUpperCase()];
  }
  return undefined;
};

export const getTestNetImageByChainId = (
  chainId: string,
): import('react-native').ImageSourcePropType | undefined => {
  const images = networksWithImages as Record<
    string,
    import('react-native').ImageSourcePropType
  >;
  if (NETWORKS_CHAIN_ID.SEPOLIA === chainId) {
    return images?.SEPOLIA;
  }
  if (NETWORKS_CHAIN_ID.LINEA_GOERLI === chainId) {
    return images?.['LINEA-GOERLI'];
  }
  if (NETWORKS_CHAIN_ID.LINEA_SEPOLIA === chainId) {
    return images?.['LINEA-SEPOLIA'];
  }
  if (NETWORKS_CHAIN_ID.MEGAETH_TESTNET === chainId) {
    return images?.['MEGAETH-TESTNET'];
  }
  return undefined;
};

/**
 * A list of chain IDs for known testnets
 */
export const TESTNET_CHAIN_IDS = [
  ChainId[NetworkType.goerli],
  ChainId[NetworkType.sepolia],
  ChainId[NetworkType['linea-goerli']],
  ChainId[NetworkType['linea-sepolia']],
  ChainId[NetworkType['megaeth-testnet']],
];

/**
 * A map of testnet chainId and its faucet link
 */
export const TESTNET_FAUCETS = {
  [ChainId[NetworkType.sepolia]]: SEPOLIA_FAUCET,
  [ChainId[NetworkType['linea-goerli']]]: LINEA_FAUCET,
  [ChainId[NetworkType['linea-sepolia']]]: LINEA_FAUCET,
};

export const isTestNetworkWithFaucet = (chainId: string): boolean =>
  (TESTNET_FAUCETS as Record<string, string | undefined>)[chainId] !== undefined;

/**
 * Determine whether the given chain ID is for a known testnet.
 *
 * @param chainId - The chain ID of the network to check
 * @returns `true` if the given chain ID is for a known testnet, `false` otherwise
 */
export const isTestNet = (chainId: string): boolean =>
  TESTNET_CHAIN_IDS.includes(chainId as never);

export function getNetworkTypeById(id?: string | number): string {
  if (!id) {
    throw new Error(NetworkSwitchErrorType.missingNetworkId);
  }
  const list = NetworkList as Record<string, { networkId?: number }>;
  const filteredNetworkTypes = NetworkListKeys.filter(
    (key) => list[key].networkId === parseInt(String(id), 10),
  );
  if (filteredNetworkTypes.length > 0) {
    return filteredNetworkTypes[0];
  }

  throw new Error(`${NetworkSwitchErrorType.unknownNetworkId} ${id}`);
}

export function getDefaultNetworkByChainId(
  chainId: string | undefined,
): unknown {
  if (!chainId) {
    throw new Error(NetworkSwitchErrorType.missingChainId);
  }

  let returnNetwork: unknown;
  const list = NetworkList as Record<string, { chainId?: string }>;

  getAllNetworks().forEach((type) => {
    if (toLowerCaseEquals(String(list[type].chainId), chainId)) {
      returnNetwork = list[type];
    }
  });

  return returnNetwork;
}

export function hasBlockExplorer(key: string): boolean {
  return key.toLowerCase() !== RPC;
}

export function isPrivateConnection(hostname: string): boolean {
  return hostname === 'localhost' || regex.localNetwork.test(hostname);
}

export interface RpcEndpoint {
  url: string;
}

export interface NetworkConfigurationEntry {
  rpcEndpoints?: RpcEndpoint[];
  blockExplorerUrls?: string[];
  defaultBlockExplorerUrlIndex?: number;
  chainId?: string;
}

/**
 * Returns custom block explorer for specific rpcTarget
 */
export function findBlockExplorerForRpc(
  rpcTargetUrl: string,
  networkConfigurations: Record<string, NetworkConfigurationEntry>,
): string | undefined {
  const networkConfiguration = Object.values(networkConfigurations).find(
    ({ rpcEndpoints }) =>
      rpcEndpoints?.some(({ url }: RpcEndpoint) => url === rpcTargetUrl),
  );

  if (networkConfiguration && networkConfiguration.blockExplorerUrls) {
    return networkConfiguration.blockExplorerUrls[
      networkConfiguration.defaultBlockExplorerUrlIndex ?? 0
    ];
  }

  return undefined;
}

/**
 * Returns block explorer for non-evm chain id
 */
export function findBlockExplorerForNonEvmChainId(
  chainId: string,
): string | undefined {
  const blockExplorerUrls = (
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP as Record<
      string,
      { url?: string } | undefined
    >
  )[chainId];
  return blockExplorerUrls?.url;
}

export interface InternalAccountLike {
  scopes?: string[];
  address: string;
}

/**
 * Returns block explorer for non-evm account
 */
export function findBlockExplorerForNonEvmAccount(
  internalAccount: InternalAccountLike,
): string | undefined {
  let scope;

  const selectedNonEvmNetworkChainId = selectSelectedNonEvmNetworkChainId(
    store.getState(),
  );
  // Check if the selectedNonEvmNetworkChainId exists in the scopes array
  if (
    selectedNonEvmNetworkChainId &&
    internalAccount.scopes?.includes(selectedNonEvmNetworkChainId)
  ) {
    // Prioritize the selected chain ID if it's in the scopes array
    scope = selectedNonEvmNetworkChainId;
  } else {
    // Fall back to a scope that is matching of our networks
    const nonEvmNetworks = selectMultichainNetworkControllerState(
      store.getState(),
    );
    const networkConfigs =
      nonEvmNetworks.multichainNetworkConfigurationsByChainId;
    const matchingNetwork = Object.values(networkConfigs || {}).find(
      (network: { chainId: string }) =>
        internalAccount.scopes?.includes(network.chainId),
    ) as { chainId: string } | undefined;

    if (matchingNetwork) {
      scope = matchingNetwork.chainId;
    }
  }
  // If we couldn't determine a scope, return undefined
  if (!scope) {
    return undefined;
  }

  const blockExplorerFormatUrls = (
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP as Record<
      string,
      MultichainBlockExplorerFormatUrls | undefined
    >
  )[scope];

  if (!blockExplorerFormatUrls) {
    return undefined;
  }

  return formatBlockExplorerAddressUrl(
    blockExplorerFormatUrls,
    internalAccount.address,
  );
}

/**
 * Returns a boolean indicating if both URLs have the same host
 */
export function compareRpcUrls(rpcOne: string, rpcTwo: string): boolean {
  // First check that both objects are of the type string
  if (typeof rpcOne === 'string' && typeof rpcTwo === 'string') {
    const rpcUrlOne = new URL(rpcOne);
    const rpcUrlTwo = new URL(rpcTwo);
    return rpcUrlOne.host === rpcUrlTwo.host;
  }
  return false;
}

/**
 * From block explorer url, get rendereable name or undefined
 */
export function getBlockExplorerName(
  blockExplorerUrl: string | undefined,
): string | undefined {
  if (!blockExplorerUrl) return undefined;
  const hostname = new URL(blockExplorerUrl).hostname;
  if (!hostname) return undefined;
  const tempBlockExplorerName = fastSplit(hostname);
  if (!tempBlockExplorerName || !tempBlockExplorerName[0]) return undefined;
  return (
    tempBlockExplorerName[0].toUpperCase() + tempBlockExplorerName.slice(1)
  );
}

/**
 * Checks whether the given value is a 0x-prefixed, non-zero, non-zero-padded,
 * hexadecimal string.
 */
export function isPrefixedFormattedHexString(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return regex.prefixedFormattedHexString.test(value);
}

export interface BlockTagParamPayload {
  method: string;
}

export function blockTagParamIndex(
  payload: BlockTagParamPayload,
): number | undefined {
  switch (payload.method) {
    // blockTag is at index 2
    case 'eth_getStorageAt':
      return 2;
    // blockTag is at index 1
    case 'eth_getBalance':
    case 'eth_getCode':
    case 'eth_getTransactionCount':
    case 'eth_call':
      return 1;
    // blockTag is at index 0
    case 'eth_getBlockByNumber':
      return 0;
    // there is no blockTag
    default:
      return undefined;
  }
}

export interface ProviderConfigLike {
  nickname?: string;
  chainId?: string;
  type?: string;
}

/**
 * Gets the current network name given the network provider.
 */
export const getNetworkNameFromProviderConfig = (
  providerConfig: ProviderConfigLike,
): string => {
  let name = strings('network_information.unknown_network');
  if (providerConfig.nickname) {
    name = providerConfig.nickname;
  } else if (providerConfig.chainId === NETWORKS_CHAIN_ID.MAINNET) {
    name = 'Ethereum Main Network';
  } else if (providerConfig.chainId === NETWORKS_CHAIN_ID.LINEA_MAINNET) {
    name = 'Linea Main Network';
  } else {
    const networkType = providerConfig.type;
    const list = NetworkList as Record<string, { name: string } | undefined>;
    name =
      (networkType && list?.[networkType]?.name) ||
      (list[RPC] as { name: string }).name;
  }
  return name;
};

export interface GetNetworkImageSourceParams {
  networkType?: string;
  chainId: string;
}

/**
 * Gets the image source given both the network type and the chain ID.
 */
export const getNetworkImageSource = ({
  networkType,
  chainId,
}: GetNetworkImageSourceParams): import('react-native').ImageSourcePropType => {
  type ImageSource = import('react-native').ImageSourcePropType;
  const defaultNetwork = getDefaultNetworkByChainId(chainId) as
    | { imageSource?: ImageSource }
    | undefined;

  if (defaultNetwork) {
    return defaultNetwork.imageSource as ImageSource;
  }

  const unpopularNetwork = UnpopularNetworkList.find(
    (networkConfig: { chainId: string }) => networkConfig.chainId === chainId,
  ) as { rpcPrefs: { imageSource: ImageSource } } | undefined;

  const customNetworkImg = (
    CustomNetworkImgMapping as Record<string, ImageSource>
  )[chainId];

  const popularNetwork = PopularList.find(
    (networkConfig: { chainId: string }) => networkConfig.chainId === chainId,
  ) as { rpcPrefs: { imageSource: ImageSource } } | undefined;

  const network = unpopularNetwork || popularNetwork;
  if (network) {
    return network.rpcPrefs.imageSource;
  }
  if (customNetworkImg) {
    return customNetworkImg;
  }

  if (isCaipChainId(chainId)) {
    return getNonEvmNetworkImageSourceByChainId(chainId) as ImageSource;
  }

  return getTestNetImage(networkType) as ImageSource;
};

export interface BlockExplorerUrlAndTitle {
  url: string | null;
  title: string | null;
}

/**
 * Returns block explorer address url and title by network
 */
export const getBlockExplorerAddressUrl = (
  networkType: string,
  address: string,
  rpcBlockExplorer: string | null = null,
): BlockExplorerUrlAndTitle => {
  const isCustomRpcBlockExplorerNetwork = networkType === RPC;

  if (isCustomRpcBlockExplorerNetwork) {
    if (!rpcBlockExplorer) return { url: null, title: null };

    const url = `${rpcBlockExplorer}/address/${address}`;
    const title = new URL(rpcBlockExplorer).hostname;
    return { url, title };
  }

  const url = getEtherscanAddressUrl(networkType, address);
  const title = getEtherscanBaseUrl(networkType).replace('https://', '');
  return { url, title };
};

/**
 * Returns block explorer transaction url and title by network
 */
export const getBlockExplorerTxUrl = (
  networkType: string,
  transactionHash: string,
  rpcBlockExplorer: string | null = null,
): BlockExplorerUrlAndTitle => {
  const isCustomRpcBlockExplorerNetwork = networkType === RPC;

  if (isCustomRpcBlockExplorerNetwork) {
    if (!rpcBlockExplorer) return { url: null, title: null };

    const url = `${rpcBlockExplorer}/tx/${transactionHash}`;
    const title = new URL(rpcBlockExplorer).hostname;
    return { url, title };
  }

  const url = getEtherscanTransactionUrl(networkType, transactionHash);
  const title = getEtherscanBaseUrl(networkType).replace('https://', '');
  return { url, title };
};

/**
 * Returns if the chainId network provided is already onboarded or not
 */
export const getIsNetworkOnboarded = (
  chainId: string,
  networkOnboardedState: Record<string, boolean | undefined>,
): boolean | undefined => networkOnboardedState[chainId];

export const isChainPermissionsFeatureEnabled = true;

export const isPermissionsSettingsV1Enabled =
  process.env.MM_PERMISSIONS_SETTINGS_V1_ENABLED === 'true';

export const isPortfolioViewEnabled = (): boolean =>
  process.env.PORTFOLIO_VIEW === 'true';

export const isMultichainV1Enabled = (): boolean =>
  process.env.MULTICHAIN_V1 === 'true';

// The whitelisted network names for the given chain IDs to prevent showing warnings on Network Settings.
export const WHILELIST_NETWORK_NAME = {
  [ChainId.mainnet]: 'Mainnet',
  [ChainId['linea-mainnet']]: 'Linea Mainnet',
  [ChainId['megaeth-testnet']]: 'Mega Testnet',
};

/**
 * Checks if the network name is valid for the given chain ID.
 * This function allows for specific network names for certain chain IDs.
 * For example, it allows 'Mainnet' for Ethereum Mainnet, 'Linea Mainnet' for Linea Mainnet,
 * and 'Mega Testnet' for MegaEth Testnet.
 *
 * @param {string} chainId - The chain ID to check.
 * @param {string} networkName - The network name to validate.
 * @param {string} nickname - The nickname of the network.
 * @returns A boolean indicating whether the network name is valid for the given chain ID.
 */
export const isValidNetworkName = (
  chainId: string,
  networkName: string,
  nickname: string,
): boolean =>
  networkName === nickname ||
  (WHILELIST_NETWORK_NAME as Record<string, string | undefined>)[chainId] ===
    nickname;
