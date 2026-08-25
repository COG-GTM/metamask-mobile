import { equal } from 'uri-js';
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
  type NetworkConfigurationLike,
  type SwitchToNetworkHooks,
} from './lib/ethereum-chain-utils';
import { getDecimalChainId } from '../../util/networks';
import { RpcEndpointType } from '@metamask/network-controller';
import { MESSAGE_TYPE } from '../createTracingMiddleware';

/**
 * A network configuration as handled by this method, which also reads block
 * explorer information.
 */
type AddEthereumChainNetwork = NetworkConfigurationLike & {
  blockExplorerUrls?: string[];
  defaultBlockExplorerUrlIndex?: number;
};

/**
 * Method hooks passed to this method implementation.
 */
type AddEthereumChainHooks = SwitchToNetworkHooks & {
  getNetworkConfigurationByChainId(
    chainId: string,
  ): AddEthereumChainNetwork | undefined;
};

interface WalletAddEthereumChainParams {
  /**
   * The JSON-RPC request. Only `origin` and `params` are read, and both are
   * validated at runtime rather than by the compiler.
   */
  req: { origin?: string; params?: unknown };
  res: { result?: unknown };
  requestUserApproval(args: {
    type: string;
    requestData?: Record<string, unknown>;
  }): Promise<unknown>;
  analytics?: Record<string, unknown>;
  hooks: AddEthereumChainHooks;
}

const waitForInteraction = async () =>
  new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve();
    });
  });

// Utility function to find or add an item in an array and return the updated array and index
const addOrUpdateIndex = <Item>(
  array: Item[],
  value: Item,
  comparator: (item: Item) => boolean,
) => {
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
}: WalletAddEthereumChainParams) => {
  const {
    NetworkController,
    MultichainNetworkController,
    ApprovalController,
    PermissionController,
    SelectedNetworkController,
  } = Engine.context;

  const origin = req.origin as string;
  const params = validateAddEthereumChainParams(
    req.params as Parameters<typeof validateAddEthereumChainParams>[0],
  );

  const {
    chainId,
    chainName,
    firstValidRPCUrl,
    firstValidBlockExplorerUrl,
    ticker,
  } = params;

  const switchToNetworkAndMetrics = async (
    network: AddEthereumChainNetwork,
    isAddNetworkFlow: boolean,
  ) => {
    const { networkClientId } =
      network.rpcEndpoints[network.defaultRpcEndpointIndex];

    const existingNetwork = hooks.getNetworkConfigurationByChainId(chainId);
    const rpcIndex = existingNetwork?.rpcEndpoints.findIndex(({ url }) =>
      equal(url as string, firstValidRPCUrl),
    );

    const blockExplorerIndex = firstValidBlockExplorerUrl
      ? existingNetwork?.blockExplorerUrls?.findIndex((url) =>
          equal(url, firstValidBlockExplorerUrl),
        )
      : undefined;

    const shouldAddOrUpdateNetwork =
      !existingNetwork ||
      rpcIndex !== existingNetwork.defaultRpcEndpointIndex ||
      (firstValidBlockExplorerUrl &&
        blockExplorerIndex !== existingNetwork.defaultBlockExplorerUrlIndex);

    await switchToNetwork({
      network: [networkClientId, network],
      chainId,
      controllers: {
        MultichainNetworkController,
        PermissionController,
        SelectedNetworkController,
      },
      requestUserApproval,
      analytics,
      origin,
      isAddNetworkFlow,
      autoApprove: shouldAddOrUpdateNetwork,
      hooks,
    });
  };

  //TODO: Remove aurora from default chains in @metamask/controller-utils
  const actualChains = { ...ChainId, aurora: undefined };
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
      } as unknown as AddEthereumChainNetwork,
      false,
    );

    res.result = null;
    return;
  }

  await validateRpcEndpoint(firstValidRPCUrl, chainId);
  const requestData: {
    chainId: string;
    blockExplorerUrl?: string | null;
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
      blockExplorerUrls: [firstValidBlockExplorerUrl as string],
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
    newNetworkConfiguration as unknown as AddEthereumChainNetwork,
    true,
  );

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
