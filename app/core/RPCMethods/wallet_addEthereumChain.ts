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
} from './lib/ethereum-chain-utils';
import { getDecimalChainId } from '../../util/networks';
import { NetworkConfiguration, RpcEndpointType } from '@metamask/network-controller';
import { MESSAGE_TYPE } from '../createTracingMiddleware';
import { Hex } from '@metamask/utils';

const waitForInteraction = async (): Promise<void> =>
  new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve();
    });
  });

interface AddOrUpdateIndexResult<T> {
  updatedArray: T[];
  index: number;
}

// Utility function to find or add an item in an array and return the updated array and index
const addOrUpdateIndex = <T>(
  array: T[],
  value: T,
  comparator: (item: T) => boolean,
): AddOrUpdateIndexResult<T> => {
  const index = array.findIndex(comparator);
  if (index === -1) {
    return {
      updatedArray: [...array, value],
      index: array.length,
    };
  }
  return { updatedArray: array, index };
};

interface WalletAddEthereumChainHooks {
  getNetworkConfigurationByChainId: (chainId: Hex) => NetworkConfiguration | undefined;
  getCaveat: (args: { target: string; caveatType: string }) => { value: unknown } | undefined;
  requestPermittedChainsPermissionIncrementalForOrigin: (args: {
    origin: string;
    chainId: Hex;
    autoApprove: boolean;
  }) => Promise<void>;
  hasApprovalRequestsForOrigin?: () => boolean;
  rejectApprovalRequestsForOrigin?: () => void;
}

interface WalletAddEthereumChainArgs {
  req: {
    params: unknown;
    origin: string;
  };
  res: {
    result: null;
  };
  requestUserApproval: (args: {
    type: string;
    requestData: Record<string, unknown>;
  }) => Promise<void>;
  analytics?: Record<string, unknown>;
  hooks: WalletAddEthereumChainHooks;
}

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
  const {
    NetworkController,
    ApprovalController,
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
    network: NetworkConfiguration,
    isAddNetworkFlow: boolean,
  ): Promise<void> => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  };

  //TODO: Remove aurora from default chains in @metamask/controller-utils
  const actualChains: Record<string, string | undefined> = { ...ChainId, aurora: undefined };
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpcResult = addOrUpdateIndex<any>(
      existingNetworkConfiguration.rpcEndpoints,
      {
        url: firstValidRPCUrl,
        type: RpcEndpointType.Custom,
        name: chainName,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (endpoint: any) => endpoint.url === firstValidRPCUrl,
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
  const requestData: Record<string, unknown> = {
    chainId,
    blockExplorerUrl: firstValidBlockExplorerUrl,
    chainName,
    rpcUrl: firstValidRPCUrl,
    ticker,
    isNetworkRpcUpdate: !!existingNetworkConfiguration,
  };

  const alerts = await checkSafeNetwork(
    getDecimalChainId(chainId),
    requestData.rpcUrl as string,
    requestData.chainName as string,
    requestData.ticker as string,
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

  let newNetworkConfiguration: NetworkConfiguration;
  if (existingNetworkConfiguration) {
    const currentChainId = selectEvmChainId(store.getState());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpcResult = addOrUpdateIndex<any>(
      existingNetworkConfiguration.rpcEndpoints,
      {
        url: firstValidRPCUrl,
        type: RpcEndpointType.Custom,
        name: chainName,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (endpoint: any) => endpoint.url === firstValidRPCUrl,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockExplorerResult = addOrUpdateIndex<any>(
      existingNetworkConfiguration.blockExplorerUrls,
      firstValidBlockExplorerUrl,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (url: any) => url === firstValidBlockExplorerUrl,
    );

    const updatedNetworkConfiguration = {
      ...existingNetworkConfiguration,
      rpcEndpoints: rpcResult.updatedArray,
      defaultRpcEndpointIndex: rpcResult.index,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blockExplorerUrls: blockExplorerResult.updatedArray.filter((url: any) => url !== null && url !== undefined),
      defaultBlockExplorerUrlIndex: blockExplorerResult.index,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newNetworkConfiguration = await NetworkController.updateNetwork(
      chainId,
      updatedNetworkConfiguration as any,
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
      blockExplorerUrls: firstValidBlockExplorerUrl ? [firstValidBlockExplorerUrl] : [],
      defaultRpcEndpointIndex: 0,
      defaultBlockExplorerUrlIndex: 0,
      name: chainName,
      nativeCurrency: ticker,
      rpcEndpoints: [
        {
          url: firstValidRPCUrl,
          name: chainName,
          type: RpcEndpointType.Custom,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
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
