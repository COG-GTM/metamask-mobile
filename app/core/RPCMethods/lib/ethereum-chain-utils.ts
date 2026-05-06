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
import { getPermittedAccounts } from '../../Permissions';
import Engine from '../../Engine';

const EVM_NATIVE_TOKEN_DECIMALS = 18;

interface NativeCurrency {
  decimals: number;
  symbol: string;
  name?: string;
}

export interface AddEthereumChainParams {
  chainId: string;
  chainName?: string | null;
  blockExplorerUrls?: string[] | null;
  nativeCurrency?: NativeCurrency | null;
  rpcUrls?: string[];
  iconUrls?: string[];
  [key: string]: unknown;
}

interface ValidatedAddEthereumChainParams {
  chainId: string;
  chainName: string;
  firstValidRPCUrl: string;
  firstValidBlockExplorerUrl: string | null;
  ticker: string;
}

interface NetworkConfigurationLike {
  rpcEndpoints?: { networkClientId?: string; url?: string }[];
  defaultRpcEndpointIndex?: number;
  chainId?: unknown;
  name?: string;
  chainName?: string;
  nickname?: string;
  shortName?: string;
  ticker?: string;
  color?: string;
  networkType?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

interface SwitchToNetworkHooks {
  getCaveat: AnyFn;
  requestPermittedChainsPermissionIncrementalForOrigin: AnyFn;
  hasApprovalRequestsForOrigin?: AnyFn;
  toNetworkConfiguration?: unknown;
  fromNetworkConfiguration?: unknown;
  rejectApprovalRequestsForOrigin?: AnyFn;
}

interface SwitchToNetworkParams {
  network: [string | undefined, NetworkConfigurationLike];
  chainId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestUserApproval: (req: any) => Promise<unknown>;
  analytics?: Record<string, unknown>;
  origin: string;
  isAddNetworkFlow?: boolean;
  hooks: SwitchToNetworkHooks;
}

export function validateChainId(chainId: unknown): string {
  const _chainId =
    typeof chainId === 'string' ? chainId.toLowerCase() : false;

  if (!_chainId || !isPrefixedFormattedHexString(_chainId)) {
    throw rpcErrors.invalidParams(
      `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
    );
  }

  if (!isSafeChainId(_chainId as `0x${string}`)) {
    throw rpcErrors.invalidParams(
      `Invalid chain ID "${_chainId}": numerical value greater than max safe value. Received:\n${chainId}`,
    );
  }

  return _chainId;
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

  const [
    {
      chainId,
      chainName: rawChainName = null,
      blockExplorerUrls = null,
      nativeCurrency = null,
      rpcUrls,
    },
  ] = params as AddEthereumChainParams[];

  const allowedKeys: Record<string, true> = {
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
  const dirtyFirstValidRPCUrl = Array.isArray(rpcUrls)
    ? rpcUrls.find((rpcUrl: string) => validUrl.isHttpsUri(rpcUrl))
    : null;

  const firstValidRPCUrl: string | null = dirtyFirstValidRPCUrl
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
): string | null {
  const firstValidBlockExplorerUrl =
    blockExplorerUrls !== null && Array.isArray(blockExplorerUrls)
      ? blockExplorerUrls.find((blockExplorerUrl: string) =>
          validUrl.isHttpsUri(blockExplorerUrl),
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
    const nc = nativeCurrency as NativeCurrency;
    if (nc.decimals !== EVM_NATIVE_TOKEN_DECIMALS) {
      throw rpcErrors.invalidParams({
        message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${nc.decimals}`,
      });
    }

    if (!nc.symbol || typeof nc.symbol !== 'string') {
      throw rpcErrors.invalidParams({
        message: `Expected a string 'nativeCurrency.symbol'. Received: ${nc.symbol}`,
      });
    }
  }
  const ticker =
    (nativeCurrency as NativeCurrency | null)?.symbol || 'ETH';

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
  let endpointChainId: string;
  try {
    endpointChainId = (await jsonRpcRequest(rpcUrl, 'eth_chainId')) as string;
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

export function findExistingNetwork<
  T extends NetworkConfigurationLike = NetworkConfigurationLike,
>(
  chainId: string,
  networkConfigurations: Record<string, T>,
): [string, T] | undefined {
  const existingEntry = Object.entries(networkConfigurations).find(
    ([, networkConfiguration]) => networkConfiguration.chainId === chainId,
  );
  if (existingEntry) {
    const [, networkConfiguration] = existingEntry;
    const networkConfigurationId =
      networkConfiguration.rpcEndpoints?.[
        networkConfiguration.defaultRpcEndpointIndex ?? 0
      ]?.networkClientId ?? '';
    return [networkConfigurationId, networkConfiguration];
  }
  return;
}

/**
 * Switches the active network for the origin if already permitted
 * otherwise requests approval to update permission first.
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

  let ethChainIds: string[] | undefined;

  if (caip25Caveat) {
    ethChainIds = getPermittedEthChainIds(
      caip25Caveat.value as Parameters<typeof getPermittedEthChainIds>[0],
    );
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
      networkConfiguration.rpcEndpoints?.[
        networkConfiguration.defaultRpcEndpointIndex ?? 0
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
                  caip25Caveat.value as Parameters<
                    typeof setPermittedEthChainIds
                  >[0],
                  [chainId as `0x${string}`],
                ),
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


