import Engine from '../Engine';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import type {
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import { selectEvmNetworkConfigurationsByChainId } from '../../selectors/networkController';
import { store } from '../../store';
import {
  validateChainId,
  findExistingNetwork,
  switchToNetwork,
  type RequestUserApproval,
  type SwitchAnalyticsParams,
  type SwitchToNetworkHooks,
} from './lib/ethereum-chain-utils';
import { MESSAGE_TYPE } from '../createTracingMiddleware';

/**
 * Hook functions consumed by {@link wallet_switchEthereumChain}.
 */
export interface SwitchEthereumChainHooks extends SwitchToNetworkHooks {
  getCurrentChainIdForDomain: (origin: string) => string;
  getNetworkConfigurationByChainId: (chainId: string) => unknown;
}

/**
 * Switch chain implementation to be used in JsonRpcEngine middleware.
 *
 * @param params.req - The JsonRpcEngine request.
 * @param params.res - The JsonRpcEngine result object.
 * @param params.requestUserApproval - The callback to trigger user approval flow.
 * @param params.analytics - Analytics parameters to be passed when tracking event via `MetaMetrics`.
 * @param params.hooks - Method hooks passed to the method implementation.
 * @returns void.
 */
export const wallet_switchEthereumChain = async ({
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
  hooks: SwitchEthereumChainHooks;
}): Promise<void> => {
  const {
    CurrencyRateController,
    NetworkController,
    MultichainNetworkController,
    SelectedNetworkController,
  } = Engine.context;
  const params = Array.isArray(req.params) ? req.params[0] : undefined;
  const { origin } = req;
  if (!params || typeof params !== 'object') {
    throw rpcErrors.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        req.params,
      )}`,
    });
  }
  const { chainId } = params as { chainId?: unknown };
  const allowedKeys: Record<string, boolean> = {
    chainId: true,
  };

  const extraKeys = Object.keys(params).filter((key) => !allowedKeys[key]);
  if (extraKeys.length) {
    throw rpcErrors.invalidParams(
      `Received unexpected keys on object parameter. Unsupported keys:\n${extraKeys}`,
    );
  }
  const _chainId = validateChainId(chainId);
  // TODO: [SOLANA] - This do not support non evm networks
  const networkConfigurations = selectEvmNetworkConfigurationsByChainId(
    store.getState(),
  );
  const existingNetwork = findExistingNetwork(_chainId, networkConfigurations);
  if (existingNetwork) {
    const currentDomainSelectedNetworkClientId =
      SelectedNetworkController.getNetworkClientIdForDomain(origin);
    const {
      configuration: { chainId: currentDomainSelectedChainId },
    } = (NetworkController.getNetworkClientById(
      currentDomainSelectedNetworkClientId,
    ) as { configuration: { chainId?: string } }) || { configuration: {} };

    if (currentDomainSelectedChainId === _chainId) {
      res.result = null;
      return;
    }

    const currentChainIdForOrigin = hooks.getCurrentChainIdForDomain(origin);

    const fromNetworkConfiguration = hooks.getNetworkConfigurationByChainId(
      currentChainIdForOrigin,
    );

    const toNetworkConfiguration = hooks.getNetworkConfigurationByChainId(
      chainId as string,
    );

    await switchToNetwork({
      network: existingNetwork,
      chainId: _chainId,
      // Preserved from legacy JS implementation: callers pass an additional
      // `controllers` field. It is forwarded verbatim to avoid runtime change.
      ...({
        controllers: {
          CurrencyRateController,
          MultichainNetworkController,
          SelectedNetworkController,
        },
      } as Record<string, unknown>),
      requestUserApproval,
      analytics,
      origin,
      isAddNetworkFlow: false,
      hooks: {
        toNetworkConfiguration,
        fromNetworkConfiguration,
        ...hooks,
      },
    });

    res.result = null;
    return;
  }

  throw providerErrors.custom({
    code: 4902, // To-be-standardized "unrecognized chain ID" error
    message: `Unrecognized chain ID "${_chainId}". Try adding the chain using wallet_addEthereumChain first.`,
  });
};

interface SwitchEthereumChainHandler {
  methodNames: string[];
  implementation: (params: {
    req: JsonRpcRequest<JsonRpcParams> & { origin: string };
    res: PendingJsonRpcResponse<Json>;
    requestUserApproval: RequestUserApproval;
    analytics: SwitchAnalyticsParams;
    hooks: SwitchEthereumChainHooks;
  }) => Promise<void>;
  hookNames: Record<string, true>;
}

export const switchEthereumChainHandler: SwitchEthereumChainHandler = {
  methodNames: [MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN],
  implementation: wallet_switchEthereumChain,
  hookNames: {
    getNetworkConfigurationByChainId: true,
    setActiveNetwork: true,
    requestUserApproval: true,
    getCaveat: true,
    getCurrentChainIdForDomain: true,
    requestPermittedChainsPermissionIncrementalForOrigin: true,
    setTokenNetworkFilter: true,
    hasApprovalRequestsForOrigin: true,
    rejectApprovalRequestsForOrigin: true,
  },
};
