import { equal } from 'uri-js';
import { InteractionManager } from 'react-native';
import { ChainId } from '@metamask/controller-utils';
import Engine from '../Engine';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type {
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import { MetaMetricsEvents, MetaMetrics } from '../../core/Analytics';
import { MetricsEventBuilder } from '../../core/Analytics/MetricsEventBuilder';
import {
  selectEvmChainId,
  selectEvmNetworkConfigurationsByChainId,
} from '../../selectors/networkController';
import { store } from '../../store';
import checkSafeNetwork from './networkChecker.util';
import {
  validateAddEthereumChainParams,
  validateRpcEndpoint,
  switchToNetwork,
  type NetworkConfigurationLike,
  type NetworkTuple,
  type RequestUserApproval,
  type SwitchAnalyticsParams,
  type SwitchToNetworkHooks,
} from './lib/ethereum-chain-utils';
import { getDecimalChainId } from '../../util/networks';
import { RpcEndpointType } from '@metamask/network-controller';
import { MESSAGE_TYPE } from '../createTracingMiddleware';

/**
 * Hook functions consumed by {@link wallet_addEthereumChain}. Extends the
 * helper-level {@link SwitchToNetworkHooks} interface with additional getters
 * specific to the add-chain flow.
 *
 * The `getNetworkConfigurationByChainId` parameter is intentionally typed as
 * `Hex` to match the underlying `NetworkController` getter so this interface
 * is satisfied by the existing `getRpcMethodMiddlewareHooks` factory.
 */
export interface AddEthereumChainHooks extends SwitchToNetworkHooks {
  getNetworkConfigurationByChainId: (chainId: `0x${string}`) =>
    | {
        chainId: string;
        rpcEndpoints: { url: string }[];
        defaultRpcEndpointIndex: number;
        blockExplorerUrls?: string[];
        defaultBlockExplorerUrlIndex?: number;
      }
    | undefined;
}

const waitForInteraction = async (): Promise<void> =>
  new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve();
    });
  });

// Utility function to find or add an item in an array and return the updated array and index
const addOrUpdateIndex = <T>(
  array: T[],
  value: T,
  comparator: (item: T) => boolean,
): { updatedArray: T[]; index: number } => {
  const index = array.findIndex(comparator);
  if (index === -1) {
    return {
      updatedArray: [...array, value],
      index: array.length,
    };
  }
  return { updatedArray: array, index };
};

/**
 * Add chain implementation to be used in JsonRpcEngine middleware.
 *
 * @param params.req - The JsonRpcEngine request.
 * @param params.res - The JsonRpcEngine result object.
 * @param params.requestUserApproval - The callback to trigger user approval flow.
 * @param params.analytics - Analytics parameters to be passed when tracking event via `MetaMetrics`.
 * @param params.hooks - Method hooks passed to the method implementation.
 * @returns Nothing.
 */
export const wallet_addEthereumChain = async ({
  req,
  res,
  requestUserApproval,
  analytics,
  hooks,
}: {
  req: JsonRpcRequest<JsonRpcParams> & { origin: string };
  res: PendingJsonRpcResponse<Json>;
  requestUserApproval: RequestUserApproval;
  analytics: SwitchAnalyticsParams;
  hooks: AddEthereumChainHooks;
}): Promise<void> => {
  const {
    NetworkController,
    MultichainNetworkController,
    ApprovalController,
    PermissionController,
    SelectedNetworkController,
  } = Engine.context;

  const { origin } = req;
  const params = validateAddEthereumChainParams(req.params);

  const {
    chainId,
    chainName,
    firstValidRPCUrl,
    firstValidBlockExplorerUrl,
    ticker,
  } = params;

  const switchToNetworkAndMetrics = async (
    network: {
      rpcEndpoints: { url: string; networkClientId?: string }[];
      defaultRpcEndpointIndex: number;
      blockExplorerUrls?: string[];
      defaultBlockExplorerUrlIndex?: number;
      chainId?: string;
      name?: string;
      nativeCurrency?: string;
      lastUpdatedAt?: number;
    },
    isAddNetworkFlow: boolean,
  ): Promise<void> => {
    const { networkClientId } =
      network.rpcEndpoints[network.defaultRpcEndpointIndex];

    const existingNetwork = hooks.getNetworkConfigurationByChainId(
      chainId as `0x${string}`,
    );
    const rpcIndex = existingNetwork?.rpcEndpoints.findIndex(({ url }) =>
      equal(url, firstValidRPCUrl),
    );

    const blockExplorerIndex =
      firstValidBlockExplorerUrl && existingNetwork
        ? existingNetwork?.blockExplorerUrls?.findIndex((url) =>
            equal(url, firstValidBlockExplorerUrl),
          )
        : undefined;

    const shouldAddOrUpdateNetwork =
      !existingNetwork ||
      rpcIndex !== existingNetwork.defaultRpcEndpointIndex ||
      Boolean(
        firstValidBlockExplorerUrl &&
          blockExplorerIndex !== existingNetwork.defaultBlockExplorerUrlIndex,
      );

    const networkConfig = {
      ...network,
      rpcEndpoints: network.rpcEndpoints,
      defaultRpcEndpointIndex: network.defaultRpcEndpointIndex,
    } as NetworkConfigurationLike;
    const networkTuple: NetworkTuple = [networkClientId, networkConfig];
    await switchToNetwork({
      network: networkTuple,
      chainId,
      // Preserved from the legacy JS implementation: callers pass an extra
      // `controllers` and `autoApprove` field. They are forwarded verbatim to
      // avoid any runtime change during the .js -> .ts migration.
      ...({
        controllers: {
          MultichainNetworkController,
          PermissionController,
          SelectedNetworkController,
        },
        autoApprove: shouldAddOrUpdateNetwork,
      } as Record<string, unknown>),
      requestUserApproval,
      analytics,
      origin,
      isAddNetworkFlow,
      hooks,
    });
  };

  //TODO: Remove aurora from default chains in @metamask/controller-utils
  const actualChains: Record<string, string | undefined> = {
    ...ChainId,
    aurora: undefined,
  };
  if (Object.values(actualChains).find((value) => value === chainId)) {
    throw rpcErrors.invalidParams(`May not specify default MetaMask chain.`);
  }
  const networkConfigurations = selectEvmNetworkConfigurationsByChainId(
    store.getState(),
  );

  const existingNetworkConfiguration = Object.values(
    networkConfigurations,
  ).find((networkConfiguration) => networkConfiguration.chainId === chainId);

  const existingNetworkConfigurationHasRpcEndpoint =
    existingNetworkConfiguration?.rpcEndpoints.some(
      (endpoint) => endpoint.url === firstValidRPCUrl,
    );

  // If the network already exists and the RPC URL is the same, perform a network switch only
  if (
    existingNetworkConfiguration &&
    existingNetworkConfigurationHasRpcEndpoint
  ) {
    const rpcResult = addOrUpdateIndex(
      existingNetworkConfiguration.rpcEndpoints,
      {
        url: firstValidRPCUrl,
        type: RpcEndpointType.Custom,
        name: chainName,
      } as (typeof existingNetworkConfiguration.rpcEndpoints)[number],
      (endpoint) => endpoint.url === firstValidRPCUrl,
    );

    switchToNetworkAndMetrics(
      {
        ...existingNetworkConfiguration,
        rpcEndpoints: rpcResult.updatedArray,
        defaultRpcEndpointIndex: rpcResult.index,
      },
      false,
    );

    res.result = null;
    return;
  }

  await validateRpcEndpoint(firstValidRPCUrl, chainId);
  const requestData: {
    chainId: string;
    blockExplorerUrl: string | null;
    chainName: string;
    rpcUrl: string;
    ticker: string;
    isNetworkRpcUpdate: boolean;
    alerts?: unknown;
  } = {
    chainId,
    blockExplorerUrl: firstValidBlockExplorerUrl,
    chainName,
    rpcUrl: firstValidRPCUrl,
    ticker,
    isNetworkRpcUpdate: !!existingNetworkConfiguration,
  };

  const alerts = await checkSafeNetwork(
    getDecimalChainId(chainId),
    requestData.rpcUrl,
    requestData.chainName,
    requestData.ticker,
  );
  requestData.alerts = alerts;

  MetaMetrics.getInstance().trackEvent(
    MetricsEventBuilder.createEventBuilder(MetaMetricsEvents.NETWORK_REQUESTED)
      .addProperties({
        chain_id: getDecimalChainId(chainId),
        source: 'Custom Network API',
        symbol: ticker,
        ...analytics,
      })
      .build(),
  );

  // Remove all existing approvals, including other add network requests.
  ApprovalController.clear(providerErrors.userRejectedRequest());

  // If existing approval request was an add network request, wait for
  // it to be rejected and for the corresponding approval flow to be ended.
  await waitForInteraction();

  try {
    await requestUserApproval({
      type: 'ADD_ETHEREUM_CHAIN',
      requestData,
    });
  } catch (error) {
    MetaMetrics.getInstance().trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.NETWORK_REQUEST_REJECTED,
      )
        .addProperties({
          chain_id: getDecimalChainId(chainId),
          source: 'Custom Network API',
          symbol: ticker,
          ...analytics,
        })
        .build(),
    );
    throw providerErrors.userRejectedRequest();
  }

  let newNetworkConfiguration;
  if (existingNetworkConfiguration) {
    const currentChainId = selectEvmChainId(store.getState());

    const rpcResult = addOrUpdateIndex(
      existingNetworkConfiguration.rpcEndpoints,
      {
        url: firstValidRPCUrl,
        type: RpcEndpointType.Custom,
        name: chainName,
      } as (typeof existingNetworkConfiguration.rpcEndpoints)[number],
      (endpoint) => endpoint.url === firstValidRPCUrl,
    );

    const blockExplorerResult = addOrUpdateIndex(
      existingNetworkConfiguration.blockExplorerUrls,
      firstValidBlockExplorerUrl as string,
      (url) => url === firstValidBlockExplorerUrl,
    );

    const updatedNetworkConfiguration = {
      ...existingNetworkConfiguration,
      rpcEndpoints: rpcResult.updatedArray,
      defaultRpcEndpointIndex: rpcResult.index,
      blockExplorerUrls: blockExplorerResult.updatedArray,
      defaultBlockExplorerUrlIndex: blockExplorerResult.index,
    };

    newNetworkConfiguration = await NetworkController.updateNetwork(
      chainId as `0x${string}`,
      updatedNetworkConfiguration,
      currentChainId === chainId
        ? {
            replacementSelectedRpcEndpointIndex:
              updatedNetworkConfiguration.defaultRpcEndpointIndex,
          }
        : undefined,
    );
  } else {
    newNetworkConfiguration = NetworkController.addNetwork({
      chainId: chainId as `0x${string}`,
      blockExplorerUrls: [firstValidBlockExplorerUrl] as string[],
      defaultRpcEndpointIndex: 0,
      defaultBlockExplorerUrlIndex: 0,
      name: chainName,
      nativeCurrency: ticker,
      rpcEndpoints: [
        {
          url: firstValidRPCUrl,
          name: chainName,
          type: RpcEndpointType.Custom,
        },
      ],
    });

    MetaMetrics.getInstance().trackEvent(
      MetricsEventBuilder.createEventBuilder(MetaMetricsEvents.NETWORK_ADDED)
        .addProperties({
          chain_id: getDecimalChainId(chainId),
          source: 'Custom Network API',
          symbol: ticker,
          ...analytics,
        })
        .build(),
    );
  }
  switchToNetworkAndMetrics(
    newNetworkConfiguration as Parameters<typeof switchToNetworkAndMetrics>[0],
    true,
  );

  res.result = null;
};

interface AddEthereumChainHandler {
  methodNames: string[];
  implementation: (params: {
    req: JsonRpcRequest<JsonRpcParams> & { origin: string };
    res: PendingJsonRpcResponse<Json>;
    requestUserApproval: RequestUserApproval;
    analytics: SwitchAnalyticsParams;
    hooks: AddEthereumChainHooks;
  }) => Promise<void>;
  hookNames: Record<string, true>;
}

export const addEthereumChainHandler: AddEthereumChainHandler = {
  methodNames: [MESSAGE_TYPE.ADD_ETHEREUM_CHAIN],
  implementation: wallet_addEthereumChain,
  hookNames: {
    addNetwork: true,
    updateNetwork: true,
    getNetworkConfigurationByChainId: true,
    setActiveNetwork: true,
    requestUserApproval: true,
    getCurrentChainIdForDomain: true,
    getCaveat: true,
    requestPermittedChainsPermissionIncrementalForOrigin: true,
    rejectApprovalRequestsForOrigin: true,
  },
};

// Unused import workaround: keep the `JsonRpcEngineNextCallback` symbol
// available to consumers that may rely on this module re-exporting the
// JSON-RPC engine types.
export type { JsonRpcEngineNextCallback, JsonRpcEngineEndCallback };
