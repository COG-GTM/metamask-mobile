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
} from '@metamask/chain-agnostic-permission';
import { MetaMetrics, MetaMetricsEvents } from '../../../core/Analytics';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import {
  getDefaultCaip25CaveatValue,
  getPermittedAccounts,
} from '../../Permissions';
import Engine from '../../Engine';

const EVM_NATIVE_TOKEN_DECIMALS = 18;

type ChainId = `0x${string}`;
type Caip25Value = Parameters<typeof setPermittedEthChainIds>[0];

interface NetworkConfiguration {
  chainId: string;
  name?: string;
  chainName?: string;
  nickname?: string;
  shortName?: string;
  ticker?: string;
  color?: string;
  networkType?: string;
  rpcEndpoints: Array<{ url: string; networkClientId?: string }>;
  defaultRpcEndpointIndex: number;
}

interface SwitchHooks {
  getCaveat: (options: unknown) => { value: Caip25Value } | undefined;
  requestPermittedChainsPermissionIncrementalForOrigin: (
    options: unknown,
  ) => Promise<unknown>;
  hasApprovalRequestsForOrigin?: () => boolean;
  toNetworkConfiguration?: unknown;
  fromNetworkConfiguration?: unknown;
  rejectApprovalRequestsForOrigin?: () => void;
}

interface SwitchInput {
  network: [string | undefined, NetworkConfiguration];
  chainId: ChainId;
  requestUserApproval: (options: unknown) => Promise<unknown>;
  analytics?: Record<string, unknown>;
  origin: string;
  isAddNetworkFlow?: boolean;
  hooks: SwitchHooks;
}

export function validateChainId(chainId: unknown): ChainId {
  const _chainId = typeof chainId === 'string' && chainId.toLowerCase();

  if (!isPrefixedFormattedHexString(_chainId as ChainId)) {
    throw rpcErrors.invalidParams(
      `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
    );
  }

  if (!isSafeChainId(_chainId as ChainId)) {
    throw rpcErrors.invalidParams(
      `Invalid chain ID "${_chainId}": numerical value greater than max safe value. Received:\n${chainId}`,
    );
  }

  return _chainId as ChainId;
}

export function validateAddEthereumChainParams(params: unknown) {
  const rawParams = params as unknown[] | null | undefined;
  if (!rawParams || !rawParams?.[0] || typeof rawParams[0] !== 'object') {
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
  ] = rawParams as Array<Record<string, unknown>>;

  const allowedKeys = {
    chainId: true,
    chainName: true,
    blockExplorerUrls: true,
    nativeCurrency: true,
    rpcUrls: true,
    iconUrls: true,
  };

  const extraKeys = Object.keys(rawParams[0] as object).filter(
    (key) => !allowedKeys[key as keyof typeof allowedKeys],
  );
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
    ? rpcUrls.find((rpcUrl) =>
        validUrl.isHttpsUri(rpcUrl as string),
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
      ? blockExplorerUrls.find((blockExplorerUrl) =>
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

function validateNativeCurrency(nativeCurrency: unknown): string {
  if (nativeCurrency !== null) {
    if (typeof nativeCurrency !== 'object' || Array.isArray(nativeCurrency)) {
      throw rpcErrors.invalidParams({
        message: `Expected null or object 'nativeCurrency'. Received:\n${nativeCurrency}`,
      });
    }
    const currency = nativeCurrency as {
      decimals?: unknown;
      symbol?: unknown;
    };
    if (currency.decimals !== EVM_NATIVE_TOKEN_DECIMALS) {
      throw rpcErrors.invalidParams({
        message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${currency.decimals}`,
      });
    }

    if (!currency.symbol || typeof currency.symbol !== 'string') {
      throw rpcErrors.invalidParams({
        message: `Expected a string 'nativeCurrency.symbol'. Received: ${currency.symbol}`,
      });
    }
  }
  const ticker =
    (nativeCurrency as { symbol?: unknown } | null | undefined)?.symbol ||
    'ETH';

  if (typeof ticker !== 'string' || ticker.length < 1 || ticker.length > 6) {
    throw rpcErrors.invalidParams({
      message: `Expected 1-6 character string 'nativeCurrency.symbol'. Received:\n${ticker}`,
    });
  }

  return ticker;
}

export async function validateRpcEndpoint(
  rpcUrl: string,
  chainId: ChainId,
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

export function findExistingNetwork(
  chainId: ChainId,
  networkConfigurations: Record<string, NetworkConfiguration>,
): [string | undefined, NetworkConfiguration] | undefined {
  const existingEntry = Object.entries(networkConfigurations).find(
    ([, networkConfiguration]) => networkConfiguration.chainId === chainId,
  );
  if (existingEntry) {
    const [, networkConfiguration] = existingEntry;
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
 * @param {object} params.network - Network configuration of the chain being switched to.
 * @param {string} params.chainId - The network client being switched to.
 * @param {Function} params.requestUserApproval - The callback to trigger user approval flow.
 * @param {object} params.analytics - Analytics parameters to be passed when tracking event via `MetaMetrics`.
 * @param {string} params.origin - The origin sending this request.
 * @param {boolean} params.isAddNetworkFlow - Variable to check if its add flow.
 * @param {object} params.hooks - Method hooks passed to the method implementation.
 * @returns a null response on success or an error if user rejects an approval when autoApprove is false or on unexpected errors.
 */
export async function switchToNetwork(input: unknown): Promise<void> {
  const {
    network,
    chainId,
    requestUserApproval,
    analytics,
    origin,
    isAddNetworkFlow = false,
    hooks,
  } = input as SwitchInput;
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

  let ethChainIds;

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
    chainPermissionsFeatureEnabled &&
    (!ethChainIds || !ethChainIds.includes(chainId));

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

  if (
    !shouldShowRequestModal &&
    !(ethChainIds as ChainId[]).includes(chainId)
  ) {
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
      (networkConfigurationId || networkConfiguration.networkType) as string,
    );
  } else {
    await MultichainNetworkController.setActiveNetwork(
      (networkConfigurationId || networkConfiguration.networkType) as string,
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
