import { rpcErrors } from '@metamask/rpc-errors';
import validUrl from 'valid-url';
import { ApprovalType, isSafeChainId } from '@metamask/controller-utils';
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
import type { Hex, Json } from '@metamask/utils';
import type { Caveat } from '@metamask/permission-controller';
import type {
  NetworkClientId,
  NetworkConfiguration,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';

const EVM_NATIVE_TOKEN_DECIMALS = 18;

export interface AddEthereumChainParameter {
  chainId?: unknown;
  chainName?: unknown;
  blockExplorerUrls?: unknown;
  nativeCurrency?: unknown;
  rpcUrls?: unknown;
  iconUrls?: unknown;
}

export interface ValidatedAddEthereumChainParams {
  chainId: Hex;
  chainName: string;
  firstValidRPCUrl: string;
  firstValidBlockExplorerUrl: string | null | undefined;
  ticker: string;
}

/**
 * Network configuration as consumed by the switch flow. Legacy configuration
 * fields are still read for display purposes when present.
 */
export type SwitchNetworkConfiguration = UpdateNetworkFields & {
  chainName?: string;
  nickname?: string;
  shortName?: string;
  color?: string;
  ticker?: string;
  networkType?: string;
};

export type ExistingNetwork = [
  NetworkClientId | undefined,
  SwitchNetworkConfiguration,
];

export interface RequestUserApprovalOptions {
  type?: string;
  origin?: string;
  requestData?: Record<string, unknown>;
}

export type RequestUserApproval = (
  options: RequestUserApprovalOptions,
) => Promise<unknown>;

export type ChainAnalyticsParams = Record<
  string,
  string | boolean | number | undefined
>;

export interface SwitchToNetworkHooks {
  getCaveat: (options: {
    target: string;
    caveatType: string;
  }) => Caveat<string, Json> | undefined;
  requestPermittedChainsPermissionIncrementalForOrigin: (options: {
    origin: string;
    chainId: Hex;
    autoApprove: boolean;
  }) => Promise<unknown>;
  hasApprovalRequestsForOrigin?: () => boolean;
  // Forwarded verbatim into the approval request data
  toNetworkConfiguration?: unknown;
  fromNetworkConfiguration?: unknown;
  rejectApprovalRequestsForOrigin?: () => void;
}

export interface SwitchToNetworkParams {
  network: ExistingNetwork;
  chainId: Hex;
  requestUserApproval: RequestUserApproval;
  analytics?: ChainAnalyticsParams;
  origin: string;
  isAddNetworkFlow?: boolean;
  hooks: SwitchToNetworkHooks;
  // Accepted for compatibility with callers; controllers are read from `Engine.context`
  controllers?: Record<string, unknown>;
  autoApprove?: boolean;
}

export function validateChainId(chainId: unknown): Hex {
  const _chainId = typeof chainId === 'string' && chainId.toLowerCase();

  if (!isPrefixedFormattedHexString(_chainId)) {
    throw rpcErrors.invalidParams(
      `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
    );
  }

  if (!isSafeChainId(_chainId as Hex)) {
    throw rpcErrors.invalidParams(
      `Invalid chain ID "${_chainId}": numerical value greater than max safe value. Received:\n${chainId}`,
    );
  }

  return _chainId as Hex;
}

export function validateAddEthereumChainParams(
  params: unknown,
): ValidatedAddEthereumChainParams {
  if (
    !Array.isArray(params) ||
    !params?.[0] ||
    typeof params[0] !== 'object'
  ) {
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
  ] = params as [AddEthereumChainParameter];

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

function validateRpcUrls(rpcUrls: unknown): string {
  const dirtyFirstValidRPCUrl: string | null | undefined = Array.isArray(
    rpcUrls,
  )
    ? rpcUrls.find((rpcUrl: unknown) => validUrl.isHttpsUri(rpcUrl as string))
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
  const firstValidBlockExplorerUrl: string | null | undefined =
    blockExplorerUrls !== null && Array.isArray(blockExplorerUrls)
      ? blockExplorerUrls.find((blockExplorerUrl: unknown) =>
          validUrl.isHttpsUri(blockExplorerUrl as string),
        )
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

function validateNativeCurrency(rawNativeCurrency: unknown): string {
  const nativeCurrency = rawNativeCurrency as {
    decimals?: unknown;
    symbol?: unknown;
  } | null;
  if (nativeCurrency !== null) {
    if (typeof nativeCurrency !== 'object' || Array.isArray(nativeCurrency)) {
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
  const ticker = nativeCurrency?.symbol || 'ETH';

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
    NetworkConfiguration | MultichainNetworkConfiguration
  >,
): ExistingNetwork | undefined {
  const existingEntry = Object.entries(networkConfigurations).find(
    ([, networkConfiguration]) => networkConfiguration.chainId === chainId,
  );
  if (existingEntry) {
    // A hex chainId match implies an EVM network configuration
    const networkConfiguration = existingEntry[1] as NetworkConfiguration;
    const networkConfigurationId =
      networkConfiguration.rpcEndpoints[
        networkConfiguration.defaultRpcEndpointIndex
      ].networkClientId;
    return [networkConfigurationId, networkConfiguration];
  }
  return;
}

/**
 * Switches the active network for the origin if already permitted
 * otherwise requests approval to update permission first.
 *
 * @param response - The JSON RPC request's response object.
 * @param end - The JSON RPC request's end callback.
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
}: SwitchToNetworkParams): Promise<void> {
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
    ethChainIds = getPermittedEthChainIds(
      caip25Caveat.value as Caip25CaveatValue,
    );
  } else {
    await requestPermittedChainsPermissionIncrementalForOrigin({
      origin,
      chainId,
      autoApprove: isAddNetworkFlow,
    });
  }

  const shouldGrantPermissions =
    chainPermissionsFeatureEnabled &&
    !ethChainIds?.includes(chainId);

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
                value: setPermittedEthChainIds(
                  caip25Caveat.value as Caip25CaveatValue,
                  [chainId],
                ),
              },
            ],
          },
        },
      });
    }
  }

  // `ethChainIds` is expected to be set whenever the request modal is skipped
  if (!shouldShowRequestModal && !(ethChainIds as Hex[]).includes(chainId)) {
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

  if (process.env.MM_PER_DAPP_SELECTED_NETWORK && originHasAccountsPermission) {
    SelectedNetworkController.setNetworkClientIdForDomain(
      origin,
      (networkConfigurationId ||
        networkConfiguration.networkType) as NetworkClientId,
    );
  } else {
    await MultichainNetworkController.setActiveNetwork(
      (networkConfigurationId ||
        networkConfiguration.networkType) as NetworkClientId,
    );
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
