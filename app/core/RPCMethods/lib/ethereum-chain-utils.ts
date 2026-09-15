import { rpcErrors } from '@metamask/rpc-errors';
import validUrl from 'valid-url';
import { ApprovalType, isSafeChainId } from '@metamask/controller-utils';
import type { Hex } from '@metamask/utils';
import type { NetworkConfiguration } from '@metamask/network-controller';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { jsonRpcRequest } from '../../../util/jsonRpcRequest';
import {
  getDecimalChainId,
  isChainPermissionsFeatureEnabled,
  isPrefixedFormattedHexString,
} from '../../../util/networks';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
  setPermittedEthChainIds,
  type Caip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import { MetaMetrics, MetaMetricsEvents } from '../../../core/Analytics';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import { getPermittedAccounts } from '../../Permissions';
import Engine from '../../Engine';

const EVM_NATIVE_TOKEN_DECIMALS = 18;

/**
 * Network configuration as consumed by the chain switching flow. Besides the
 * canonical `NetworkConfiguration` shape it tolerates a few legacy fields that
 * older configurations / callers may still provide.
 */
export type SwitchableNetworkConfiguration = NetworkConfiguration & {
  chainName?: string;
  nickname?: string;
  shortName?: string;
  ticker?: string;
  color?: string;
  networkType?: string;
};

export type ExistingNetwork = [
  networkClientId: string,
  networkConfiguration: SwitchableNetworkConfiguration,
];

export interface AddEthereumChainParameter {
  chainId: Hex;
  chainName: string;
  firstValidRPCUrl: string;
  firstValidBlockExplorerUrl: string | null | undefined;
  ticker: string;
}

export interface RequestUserApprovalArgs {
  type: string;
  origin?: string;
  requestData: Record<string, unknown>;
}

export type RequestUserApproval = (
  args: RequestUserApprovalArgs,
) => Promise<unknown>;

export interface SwitchToNetworkHooks {
  getCaveat: (args: {
    target: string;
    caveatType: string;
  }) => { type?: string; value: Caip25CaveatValue } | undefined;
  requestPermittedChainsPermissionIncrementalForOrigin: (options: {
    origin: string;
    chainId: Hex;
    autoApprove: boolean;
  }) => Promise<unknown>;
  hasApprovalRequestsForOrigin?: () => boolean;
  toNetworkConfiguration?: unknown;
  fromNetworkConfiguration?: unknown;
  rejectApprovalRequestsForOrigin?: () => void;
}

export interface SwitchToNetworkArgs {
  network: ExistingNetwork;
  chainId: Hex;
  requestUserApproval: RequestUserApproval;
  analytics?: Record<string, unknown>;
  origin: string;
  isAddNetworkFlow?: boolean;
  hooks: SwitchToNetworkHooks;
}

const isHexString = (value: unknown): value is Hex =>
  typeof value === 'string' && value.startsWith('0x');

export function validateChainId(chainId: unknown): Hex {
  const _chainId = typeof chainId === 'string' && chainId.toLowerCase();

  if (!isPrefixedFormattedHexString(_chainId) || !isHexString(_chainId)) {
    throw rpcErrors.invalidParams(
      `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
    );
  }

  if (!isSafeChainId(_chainId)) {
    throw rpcErrors.invalidParams(
      `Invalid chain ID "${_chainId}": numerical value greater than max safe value. Received:\n${chainId}`,
    );
  }

  return _chainId;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function validateAddEthereumChainParams(
  params: unknown,
): AddEthereumChainParameter {
  if (!Array.isArray(params) || !params?.[0] || !isRecord(params[0])) {
    throw rpcErrors.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        params,
      )}`,
    });
  }

  const [
    {
      chainId,
      chainName: rawChainName = null,
      blockExplorerUrls = null,
      nativeCurrency = null,
      rpcUrls,
    },
  ] = params as [Record<string, unknown>];

  const allowedKeys: Record<string, boolean> = {
    chainId: true,
    chainName: true,
    blockExplorerUrls: true,
    nativeCurrency: true,
    rpcUrls: true,
    iconUrls: true,
  };

  const extraKeys = Object.keys(params[0]).filter((key) => !allowedKeys[key]);
  if (extraKeys.length) {
    throw rpcErrors.invalidParams(
      `Received unexpected keys on object parameter. Unsupported keys:\n${extraKeys}`,
    );
  }
  const _chainId = validateChainId(chainId);

  const firstValidRPCUrl = validateRpcUrls(rpcUrls);

  const firstValidBlockExplorerUrl =
    validateBlockExplorerUrls(blockExplorerUrls);

  const chainName = validateChainName(rawChainName);

  const ticker = validateNativeCurrency(nativeCurrency);

  return {
    chainId: _chainId,
    chainName,
    firstValidRPCUrl,
    firstValidBlockExplorerUrl,
    ticker,
  };
}

const isHttpsUri = (value: unknown): value is string =>
  typeof value === 'string' && Boolean(validUrl.isHttpsUri(value));

function validateRpcUrls(rpcUrls: unknown): string {
  const dirtyFirstValidRPCUrl = Array.isArray(rpcUrls)
    ? rpcUrls.find(isHttpsUri)
    : null;

  const firstValidRPCUrl = dirtyFirstValidRPCUrl
    ? dirtyFirstValidRPCUrl.replace(/([^/])\/+$/g, '$1')
    : dirtyFirstValidRPCUrl;

  if (!firstValidRPCUrl) {
    throw rpcErrors.invalidParams(
      `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
    );
  }

  return firstValidRPCUrl;
}

function validateBlockExplorerUrls(
  blockExplorerUrls: unknown,
): string | null | undefined {
  const firstValidBlockExplorerUrl =
    blockExplorerUrls !== null && Array.isArray(blockExplorerUrls)
      ? blockExplorerUrls.find(isHttpsUri)
      : null;

  if (blockExplorerUrls !== null && !firstValidBlockExplorerUrl) {
    throw rpcErrors.invalidParams(
      `Expected null or array with at least one valid string HTTPS URL 'blockExplorerUrl'. Received: ${blockExplorerUrls}`,
    );
  }

  return firstValidBlockExplorerUrl;
}

function validateChainName(rawChainName: unknown): string {
  if (typeof rawChainName !== 'string' || !rawChainName) {
    throw rpcErrors.invalidParams({
      message: `Expected non-empty string 'chainName'. Received:\n${rawChainName}`,
    });
  }
  return rawChainName.length > 100
    ? rawChainName.substring(0, 100)
    : rawChainName;
}

function validateNativeCurrency(nativeCurrency: unknown): string {
  if (nativeCurrency !== null) {
    if (!isRecord(nativeCurrency) || Array.isArray(nativeCurrency)) {
      throw rpcErrors.invalidParams({
        message: `Expected null or object 'nativeCurrency'. Received:\n${nativeCurrency}`,
      });
    }
    if (nativeCurrency.decimals !== EVM_NATIVE_TOKEN_DECIMALS) {
      throw rpcErrors.invalidParams({
        message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${nativeCurrency.decimals}`,
      });
    }

    if (!nativeCurrency.symbol || typeof nativeCurrency.symbol !== 'string') {
      throw rpcErrors.invalidParams({
        message: `Expected a string 'nativeCurrency.symbol'. Received: ${nativeCurrency.symbol}`,
      });
    }
  }
  const ticker =
    isRecord(nativeCurrency) && typeof nativeCurrency.symbol === 'string'
      ? nativeCurrency.symbol
      : 'ETH';

  if (typeof ticker !== 'string' || ticker.length < 1 || ticker.length > 6) {
    throw rpcErrors.invalidParams({
      message: `Expected 1-6 character string 'nativeCurrency.symbol'. Received:\n${ticker}`,
    });
  }

  return ticker;
}

export async function validateRpcEndpoint(
  rpcUrl: string,
  chainId: Hex,
): Promise<void> {
  let endpointChainId: unknown;
  try {
    endpointChainId = await jsonRpcRequest(rpcUrl, 'eth_chainId');
  } catch (err) {
    throw rpcErrors.internal({
      message: `Request for method 'eth_chainId on ${rpcUrl} failed`,
      data: { networkErr: err },
    });
  }
  if (chainId !== endpointChainId) {
    throw rpcErrors.invalidParams({
      message: `Chain ID returned by RPC URL ${rpcUrl} does not match ${chainId}`,
      data: { chainId: endpointChainId },
    });
  }
}

export function findExistingNetwork(
  chainId: Hex,
  networkConfigurations: Record<
    string,
    SwitchableNetworkConfiguration | MultichainNetworkConfiguration
  >,
): ExistingNetwork | undefined {
  const existingEntry = Object.values(networkConfigurations).find(
    (
      networkConfiguration,
    ): networkConfiguration is SwitchableNetworkConfiguration =>
      networkConfiguration.chainId === chainId &&
      'rpcEndpoints' in networkConfiguration,
  );
  if (existingEntry) {
    const networkConfiguration = existingEntry;
    const networkConfigurationId =
      networkConfiguration.rpcEndpoints[
        networkConfiguration.defaultRpcEndpointIndex
      ].networkClientId;
    return [networkConfigurationId, networkConfiguration];
  }
  return undefined;
}

/**
 * Switches the active network for the origin if already permitted
 * otherwise requests approval to update permission first.
 *
 * @param params.network - Network configuration of the chain being switched to.
 * @param params.chainId - The network client being switched to.
 * @param params.requestUserApproval - The callback to trigger user approval flow.
 * @param params.analytics - Analytics parameters to be passed when tracking event via `MetaMetrics`.
 * @param params.origin - The origin sending this request.
 * @param params.isAddNetworkFlow - Variable to check if its add flow.
 * @param params.hooks - Method hooks passed to the method implementation.
 * @returns a null response on success or an error if user rejects an approval when autoApprove is false or on unexpected errors.
 */
export async function switchToNetwork({
  network,
  chainId,
  requestUserApproval,
  analytics,
  origin,
  isAddNetworkFlow = false,
  hooks,
}: SwitchToNetworkArgs): Promise<void> {
  const {
    getCaveat,
    requestPermittedChainsPermissionIncrementalForOrigin,
    hasApprovalRequestsForOrigin,
    toNetworkConfiguration,
    fromNetworkConfiguration,
    rejectApprovalRequestsForOrigin,
  } = hooks;
  const {
    MultichainNetworkController,
    PermissionController,
    SelectedNetworkController,
  } = Engine.context;

  const [networkConfigurationId, networkConfiguration] = network;

  // for some reason this extra step is necessary for accessing the env variable in test environment
  const chainPermissionsFeatureEnabled =
    { ...process.env }?.NODE_ENV === 'test'
      ? { ...process.env }?.MM_CHAIN_PERMISSIONS === 'true'
      : isChainPermissionsFeatureEnabled;

  const caip25Caveat = getCaveat({
    target: Caip25EndowmentPermissionName,
    caveatType: Caip25CaveatType,
  });

  let ethChainIds: Hex[] | undefined;

  if (caip25Caveat) {
    ethChainIds = getPermittedEthChainIds(caip25Caveat.value);
  } else {
    await requestPermittedChainsPermissionIncrementalForOrigin({
      origin,
      chainId,
      autoApprove: isAddNetworkFlow,
    });
  }

  const shouldGrantPermissions =
    chainPermissionsFeatureEnabled && !ethChainIds?.includes(chainId);

  const requestModalType = isAddNetworkFlow ? 'new' : 'switch';

  const shouldShowRequestModal =
    (!isAddNetworkFlow && shouldGrantPermissions) ||
    !chainPermissionsFeatureEnabled;

  const requestData = {
    rpcUrl:
      networkConfiguration.rpcEndpoints[
        networkConfiguration.defaultRpcEndpointIndex
      ],
    chainId,
    chainName:
      networkConfiguration.name ||
      networkConfiguration.chainName ||
      networkConfiguration.nickname ||
      networkConfiguration.shortName,
    ticker: networkConfiguration.ticker || 'ETH',
    chainColor: networkConfiguration.color,
    pageMeta: {
      url: origin,
    },
  };

  if (shouldShowRequestModal) {
    await requestUserApproval({
      type: 'SWITCH_ETHEREUM_CHAIN',
      requestData: { ...requestData, type: requestModalType },
    });

    if (caip25Caveat) {
      await PermissionController.grantPermissionsIncremental({
        subject: { origin },
        approvedPermissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: setPermittedEthChainIds(caip25Caveat.value, [chainId]),
              },
            ],
          },
        },
      });
    }
  }

  if (!shouldShowRequestModal && !ethChainIds?.includes(chainId)) {
    await requestPermittedChainsPermissionIncrementalForOrigin({
      origin,
      chainId,
      autoApprove: isAddNetworkFlow,
    });
  } else if (hasApprovalRequestsForOrigin?.() && !isAddNetworkFlow) {
    await requestUserApproval({
      origin,
      type: ApprovalType.SwitchEthereumChain,
      requestData: {
        toNetworkConfiguration,
        fromNetworkConfiguration,
      },
    });
  }

  rejectApprovalRequestsForOrigin?.();

  const originHasAccountsPermission = getPermittedAccounts(origin).length > 0;

  const networkClientId =
    networkConfigurationId || networkConfiguration.networkType || '';

  if (process.env.MM_PER_DAPP_SELECTED_NETWORK && originHasAccountsPermission) {
    SelectedNetworkController.setNetworkClientIdForDomain(
      origin,
      networkClientId,
    );
  } else {
    await MultichainNetworkController.setActiveNetwork(networkClientId);
  }

  const analyticsParams = {
    chain_id: getDecimalChainId(chainId),
    source: 'Custom Network API',
    symbol: networkConfiguration?.ticker || 'ETH',
    ...analytics,
  };

  MetaMetrics.getInstance().trackEvent(
    MetricsEventBuilder.createEventBuilder(MetaMetricsEvents.NETWORK_SWITCHED)
      .addProperties(analyticsParams)
      .build(),
  );
}
