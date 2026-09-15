import { InteractionManager } from 'react-native';
import { ChainId } from '@metamask/controller-utils';
import Engine from '../Engine';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
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
  type RequestUserApproval,
  type SwitchToNetworkHooks,
  type SwitchableNetworkConfiguration,
} from './lib/ethereum-chain-utils';
import { getDecimalChainId } from '../../util/networks';
import {
  RpcEndpointType,
  type NetworkConfiguration,
  type UpdateNetworkFields,
} from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
import { MESSAGE_TYPE } from '../createTracingMiddleware';

export interface AddEthereumChainHooks extends SwitchToNetworkHooks {
  getCurrentChainIdForDomain?: (domain: string) => Hex;
  getNetworkConfigurationByChainId: (
    chainId: Hex,
  ) => NetworkConfiguration | undefined;
}

export interface WalletAddEthereumChainArgs {
  req: { origin: string; params?: unknown };
  res: { result?: unknown };
  requestUserApproval: RequestUserApproval;
  analytics?: Record<string, unknown>;
  hooks: AddEthereumChainHooks;
}

const waitForInteraction = async (): Promise<void> =>
  new Promise((resolve) => {
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
 * @returns {Nothing}.
 */
export const wallet_addEthereumChain = async ({
  req,
  res,
  requestUserApproval,
  analytics,
  hooks,
}: WalletAddEthereumChainArgs): Promise<void> => {
  const { NetworkController, ApprovalController } = Engine.context;

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
    network: SwitchableNetworkConfiguration,
    isAddNetworkFlow: boolean,
  ) => {
    const { networkClientId } =
      network.rpcEndpoints[network.defaultRpcEndpointIndex];

    await switchToNetwork({
      network: [networkClientId, network],
      chainId,
      requestUserApproval,
      analytics,
      origin,
      isAddNetworkFlow,
      hooks,
    });
  };

  //TODO: Remove aurora from default chains in @metamask/controller-utils
  const actualChains: Record<string, Hex | undefined> = {
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
    const rpcIndex = existingNetworkConfiguration.rpcEndpoints.findIndex(
      (endpoint) => endpoint.url === firstValidRPCUrl,
    );

    switchToNetworkAndMetrics(
      {
        ...existingNetworkConfiguration,
        defaultRpcEndpointIndex: rpcIndex,
      },
      false,
    );

    res.result = null;
    return;
  }

  await validateRpcEndpoint(firstValidRPCUrl, chainId);
  const alerts = await checkSafeNetwork(
    getDecimalChainId(chainId),
    firstValidRPCUrl,
    chainName,
    ticker,
  );

  const requestData = {
    chainId,
    blockExplorerUrl: firstValidBlockExplorerUrl,
    chainName,
    rpcUrl: firstValidRPCUrl,
    ticker,
    isNetworkRpcUpdate: !!existingNetworkConfiguration,
    alerts,
  };

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

  let newNetworkConfiguration: NetworkConfiguration;
  if (existingNetworkConfiguration) {
    const currentChainId = selectEvmChainId(store.getState());

    const rpcResult = addOrUpdateIndex<
      UpdateNetworkFields['rpcEndpoints'][number]
    >(
      existingNetworkConfiguration.rpcEndpoints,
      {
        url: firstValidRPCUrl,
        type: RpcEndpointType.Custom,
        name: chainName,
      },
      (endpoint) => endpoint.url === firstValidRPCUrl,
    );

    const blockExplorerResult = firstValidBlockExplorerUrl
      ? addOrUpdateIndex(
          existingNetworkConfiguration.blockExplorerUrls,
          firstValidBlockExplorerUrl,
          (url) => url === firstValidBlockExplorerUrl,
        )
      : {
          updatedArray: existingNetworkConfiguration.blockExplorerUrls,
          index: existingNetworkConfiguration.defaultBlockExplorerUrlIndex,
        };

    const updatedNetworkConfiguration = {
      ...existingNetworkConfiguration,
      rpcEndpoints: rpcResult.updatedArray,
      defaultRpcEndpointIndex: rpcResult.index,
      blockExplorerUrls: blockExplorerResult.updatedArray,
      defaultBlockExplorerUrlIndex: blockExplorerResult.index,
    };

    newNetworkConfiguration = await NetworkController.updateNetwork(
      chainId,
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
      chainId,
      blockExplorerUrls: firstValidBlockExplorerUrl
        ? [firstValidBlockExplorerUrl]
        : [],
      defaultRpcEndpointIndex: 0,
      defaultBlockExplorerUrlIndex: firstValidBlockExplorerUrl ? 0 : undefined,
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
  switchToNetworkAndMetrics(newNetworkConfiguration, true);

  res.result = null;
};

export const addEthereumChainHandler = {
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
