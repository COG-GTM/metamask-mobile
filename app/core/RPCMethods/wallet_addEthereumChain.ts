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
import { RpcEndpointType } from '@metamask/network-controller';
import { MESSAGE_TYPE } from '../createTracingMiddleware';

interface RpcEndpoint {
  url: string;
  type: string;
  name: string;
  networkClientId?: string;
}

interface NetworkConfiguration {
  chainId: string;
  name?: string;
  nativeCurrency?: string;
  rpcEndpoints: RpcEndpoint[];
  defaultRpcEndpointIndex: number;
  blockExplorerUrls: string[];
  defaultBlockExplorerUrlIndex: number;
}

interface JsonRpcRequest {
  origin: string;
  params: unknown[];
}

interface JsonRpcResponse {
  result: null | unknown;
}

interface Analytics {
  [key: string]: unknown;
}

interface Hooks {
  addNetwork?: (config: unknown) => NetworkConfiguration;
  updateNetwork?: (
    chainId: string,
    config: NetworkConfiguration,
    options?: unknown,
  ) => Promise<NetworkConfiguration>;
  getNetworkConfigurationByChainId: (chainId: string) => NetworkConfiguration | undefined;
  setActiveNetwork?: (id: string) => Promise<void>;
  requestUserApproval?: (params: unknown) => Promise<void>;
  getCurrentChainIdForDomain?: (origin: string) => string;
  getCaveat?: (params: unknown) => unknown;
  requestPermittedChainsPermissionIncrementalForOrigin?: (params: unknown) => Promise<void>;
  rejectApprovalRequestsForOrigin?: () => void;
}

interface WalletAddEthereumChainParams {
  req: JsonRpcRequest;
  res: JsonRpcResponse;
  requestUserApproval: (params: { type: string; requestData: unknown }) => Promise<void>;
  analytics: Analytics;
  hooks: Hooks;
}

interface AddOrUpdateResult<T> {
  updatedArray: T[];
  index: number;
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
): AddOrUpdateResult<T> => {
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
 */
export const wallet_addEthereumChain = async ({
  req,
  res,
  requestUserApproval,
  analytics,
  hooks,
}: WalletAddEthereumChainParams): Promise<void> => {
  const {
    NetworkController,
    MultichainNetworkController,
    ApprovalController,
    PermissionController,
    SelectedNetworkController,
  } = Engine.context;

  const { origin } = req;
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
    network: NetworkConfiguration,
    isAddNetworkFlow: boolean,
  ): Promise<void> => {
    const { networkClientId } =
      network.rpcEndpoints[network.defaultRpcEndpointIndex];

    const existingNetwork = hooks.getNetworkConfigurationByChainId(chainId);
    const rpcIndex = existingNetwork?.rpcEndpoints.findIndex(({ url }) =>
      equal(url, firstValidRPCUrl),
    );

    const blockExplorerIndex = firstValidBlockExplorerUrl
      ? existingNetwork?.blockExplorerUrls.findIndex((url) =>
          equal(url, firstValidBlockExplorerUrl),
        )
      : undefined;

    const shouldAddOrUpdateNetwork =
      !existingNetwork ||
      rpcIndex !== existingNetwork.defaultRpcEndpointIndex ||
      (firstValidBlockExplorerUrl &&
        blockExplorerIndex !== existingNetwork.defaultBlockExplorerUrlIndex);

    await switchToNetwork({
      network: [networkClientId || '', network],
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
      autoApprove: !!shouldAddOrUpdateNetwork,
      hooks,
    } as Parameters<typeof switchToNetwork>[0]);
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
  ).find(
    (networkConfiguration) =>
      (networkConfiguration as NetworkConfiguration).chainId === chainId,
  ) as NetworkConfiguration | undefined;

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
      },
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
    alerts?: unknown[];
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
  (ApprovalController as { clear: (error: Error) => void }).clear(
    providerErrors.userRejectedRequest(),
  );

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

    const rpcResult = addOrUpdateIndex(
      existingNetworkConfiguration.rpcEndpoints,
      {
        url: firstValidRPCUrl,
        type: RpcEndpointType.Custom,
        name: chainName,
      },
      (endpoint) => endpoint.url === firstValidRPCUrl,
    );

    const blockExplorerResult = addOrUpdateIndex(
      existingNetworkConfiguration.blockExplorerUrls,
      firstValidBlockExplorerUrl || '',
      (url) => url === firstValidBlockExplorerUrl,
    );

    const updatedNetworkConfiguration: NetworkConfiguration = {
      ...existingNetworkConfiguration,
      rpcEndpoints: rpcResult.updatedArray,
      defaultRpcEndpointIndex: rpcResult.index,
      blockExplorerUrls: blockExplorerResult.updatedArray,
      defaultBlockExplorerUrlIndex: blockExplorerResult.index,
    };

    newNetworkConfiguration = await (
      NetworkController as {
        updateNetwork: (
          chainId: string,
          config: NetworkConfiguration,
          options?: unknown,
        ) => Promise<NetworkConfiguration>;
      }
    ).updateNetwork(
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
    newNetworkConfiguration = (
      NetworkController as {
        addNetwork: (config: unknown) => NetworkConfiguration;
      }
    ).addNetwork({
      chainId,
      blockExplorerUrls: [firstValidBlockExplorerUrl || ''],
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
