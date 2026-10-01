import { rpcErrors } from '@metamask/rpc-errors';
import validUrl from 'valid-url';
import { ApprovalType, isSafeChainId } from '@metamask/controller-utils';
import type {
  NetworkClientId,
  NetworkConfiguration,
} from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
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
 * Parameters passed in by an `wallet_addEthereumChain` request.
 */
export interface AddEthereumChainRawParams {
  chainId?: unknown;
  chainName?: unknown;
  blockExplorerUrls?: unknown;
  nativeCurrency?: unknown;
  rpcUrls?: unknown;
  iconUrls?: unknown;
}

/**
 * Result of validating an `wallet_addEthereumChain` request's params.
 */
export interface ValidatedAddEthereumChainParams {
  chainId: string;
  chainName: string;
  firstValidRPCUrl: string;
  firstValidBlockExplorerUrl: string | null;
  ticker: string;
}

/**
 * Shape of a network configuration entry as referenced by callers in this
 * module. This is a structural subset of the controller's
 * {@link NetworkConfiguration} type plus the legacy alias fields that the
 * runtime code reads from. Using `Partial` allows preserving existing JS
 * behaviour of optional/missing fields.
 */
export type NetworkConfigurationLike = Partial<NetworkConfiguration> & {
  rpcEndpoints: { url: string; networkClientId?: string }[];
  blockExplorerUrls?: string[];
  defaultRpcEndpointIndex: number;
  defaultBlockExplorerUrlIndex?: number;
  chainName?: string;
  nickname?: string;
  shortName?: string;
  ticker?: string;
  color?: string;
  networkType?: string;
};

/**
 * Tuple shape used internally to identify a network: the network client ID and
 * its associated configuration.
 */
export type NetworkTuple = [
  NetworkClientId | undefined,
  NetworkConfigurationLike,
];

/**
 * The set of hook functions consumed by {@link switchToNetwork}.
 *
 * The base type is intentionally permissive — call sites in
 * `RPCMethodMiddleware` pass a heterogeneous bag of hooks (e.g. with looser
 * argument types like `Hex` rather than `string`) and the helpers below pluck
 * out only the fields they need at runtime. The index signature preserves
 * compatibility with existing JS-style callers during the .js -> .ts
 * migration without resorting to `any`.
 */
export interface SwitchToNetworkHooks {
  getCaveat?: (params: {
    target: string;
    caveatType: string;
  }) => { value: Caip25CaveatValue } | undefined;
  // `chainId` is typed as `Hex` to match the concrete hook implementation in
  // `RPCMethodMiddleware`; at runtime, every caller produces a 0x-prefixed
  // hex string before invoking the helpers in this module.
  requestPermittedChainsPermissionIncrementalForOrigin: (params: {
    origin: string;
    chainId: Hex;
    autoApprove: boolean;
  }) => Promise<void>;
  hasApprovalRequestsForOrigin?: () => boolean;
  toNetworkConfiguration?: unknown;
  fromNetworkConfiguration?: unknown;
  rejectApprovalRequestsForOrigin?: () => void;
  [key: string]: unknown;
}

/**
 * Analytics parameters that callers may forward into the metrics event for a
 * network switch. The shape is intentionally flexible because the keys vary
 * per call site.
 */
export type SwitchAnalyticsParams = Record<string, unknown> | undefined;

/**
 * Callback invoked by the helpers in this module to surface a user approval
 * request flow. The runtime contract is opaque — it accepts a request
 * descriptor and either resolves on approval or rejects on user denial.
 *
 * The top-level `type` and `requestData` are intentionally optional to match
 * the existing call site in `RPCMethodMiddleware` which defaults both fields.
 *
 * `requestData` is intentionally typed as `object` rather than `unknown` so
 * that this declared type is assignable from the legacy JS function shape
 * `({ type = '', requestData = {} }) => Promise<unknown>` used by
 * `RPCMethodMiddleware`.
 */
export type RequestUserApproval = (request: {
  type?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  requestData?: object;
  origin?: string;
}) => Promise<unknown>;

export function validateChainId(chainId: unknown): string {
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

  return _chainId as string;
}

export function validateAddEthereumChainParams(
  params: unknown,
): ValidatedAddEthereumChainParams {
  if (
    !params ||
    !Array.isArray(params) ||
    !params[0] ||
    typeof params[0] !== 'object'
  ) {
    throw rpcErrors.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        params,
      )}`,
    });
  }

  const [rawParams] = params as [AddEthereumChainRawParams];
  const {
    chainId,
    chainName: rawChainName = null,
    blockExplorerUrls = null,
    nativeCurrency = null,
    rpcUrls,
  } = rawParams;

  const allowedKeys: Record<string, boolean> = {
    chainId: true,
    chainName: true,
    blockExplorerUrls: true,
    nativeCurrency: true,
    rpcUrls: true,
    iconUrls: true,
  };

  const extraKeys = Object.keys(rawParams).filter((key) => !allowedKeys[key]);
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
  const dirtyFirstValidRPCUrl = Array.isArray(rpcUrls)
    ? (rpcUrls as unknown[]).find(
        (rpcUrl): rpcUrl is string =>
          typeof rpcUrl === 'string' && Boolean(validUrl.isHttpsUri(rpcUrl)),
      )
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

function validateBlockExplorerUrls(blockExplorerUrls: unknown): string | null {
  const firstValidBlockExplorerUrl =
    blockExplorerUrls !== null && Array.isArray(blockExplorerUrls)
      ? (blockExplorerUrls as unknown[]).find(
          (blockExplorerUrl): blockExplorerUrl is string =>
            typeof blockExplorerUrl === 'string' &&
            Boolean(validUrl.isHttpsUri(blockExplorerUrl)),
        )
      : null;

  if (blockExplorerUrls !== null && !firstValidBlockExplorerUrl) {
    throw rpcErrors.invalidParams(
      `Expected null or array with at least one valid string HTTPS URL 'blockExplorerUrl'. Received: ${blockExplorerUrls}`,
    );
  }

  return firstValidBlockExplorerUrl ?? null;
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
    if (typeof nativeCurrency !== 'object' || Array.isArray(nativeCurrency)) {
      throw rpcErrors.invalidParams({
        message: `Expected null or object 'nativeCurrency'. Received:\n${nativeCurrency}`,
      });
    }
    const nativeCurrencyObj = nativeCurrency as {
      decimals?: unknown;
      symbol?: unknown;
    };
    if (nativeCurrencyObj.decimals !== EVM_NATIVE_TOKEN_DECIMALS) {
      throw rpcErrors.invalidParams({
        message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${nativeCurrencyObj.decimals}`,
      });
    }

    if (
      !nativeCurrencyObj.symbol ||
      typeof nativeCurrencyObj.symbol !== 'string'
    ) {
      throw rpcErrors.invalidParams({
        message: `Expected a string 'nativeCurrency.symbol'. Received: ${nativeCurrencyObj.symbol}`,
      });
    }
  }
  const ticker =
    (nativeCurrency as { symbol?: string } | null)?.symbol || 'ETH';

  if (typeof ticker !== 'string' || ticker.length < 1 || ticker.length > 6) {
    throw rpcErrors.invalidParams({
      message: `Expected 1-6 character string 'nativeCurrency.symbol'. Received:\n${ticker}`,
    });
  }

  return ticker;
}

export async function validateRpcEndpoint(
  rpcUrl: string,
  chainId: string,
): Promise<void> {
  let endpointChainId;
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

/**
 * Look up the network configuration entry whose `chainId` matches the
 * given `chainId`. The parameter is intentionally broad — callers pass
 * either the strict `NetworkController` map or the more permissive
 * `MultichainNetworkController` map; at runtime only the `chainId`,
 * `rpcEndpoints`, and `defaultRpcEndpointIndex` fields are inspected.
 */
export function findExistingNetwork(
  chainId: string,
  networkConfigurations: Record<string, unknown>,
): NetworkTuple | undefined {
  const existingEntry = Object.entries(networkConfigurations).find(
    ([, networkConfiguration]) =>
      (networkConfiguration as { chainId?: string }).chainId === chainId,
  );
  if (existingEntry) {
    const [, networkConfiguration] = existingEntry as [
      string,
      NetworkConfigurationLike,
    ];
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
}: {
  network: NetworkTuple;
  chainId: string;
  requestUserApproval: RequestUserApproval;
  analytics: SwitchAnalyticsParams;
  origin: string;
  isAddNetworkFlow?: boolean;
  hooks: SwitchToNetworkHooks;
}): Promise<void> {
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

  const caip25Caveat = getCaveat?.({
    target: Caip25EndowmentPermissionName,
    caveatType: Caip25CaveatType,
  });

  let ethChainIds: string[] | undefined;

  if (caip25Caveat) {
    ethChainIds = getPermittedEthChainIds(caip25Caveat.value);
  } else {
    await requestPermittedChainsPermissionIncrementalForOrigin({
      origin,
      chainId: chainId as Hex,
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
                value: setPermittedEthChainIds(caip25Caveat.value, [
                  chainId as Hex,
                ]),
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
      chainId: chainId as Hex,
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

  const targetNetworkClientId = (networkConfigurationId ||
    networkConfiguration.networkType) as string;
  if (process.env.MM_PER_DAPP_SELECTED_NETWORK && originHasAccountsPermission) {
    SelectedNetworkController.setNetworkClientIdForDomain(
      origin,
      targetNetworkClientId,
    );
  } else {
    await MultichainNetworkController.setActiveNetwork(targetNetworkClientId);
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
