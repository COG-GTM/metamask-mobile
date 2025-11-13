import Engine from '../Engine';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import { selectEvmNetworkConfigurationsByChainId } from '../../selectors/networkController';
import { store } from '../../store';
import {
  validateChainId,
  findExistingNetwork,
  switchToNetwork,
} from './lib/ethereum-chain-utils';
import { MESSAGE_TYPE } from '../createTracingMiddleware';
import { JsonRpcRequest, PendingJsonRpcResponse, Json } from '@metamask/utils';
import { AsyncJsonRpcEngineNextCallback, JsonRpcEngineEndCallback } from '@metamask/json-rpc-engine';
import { type Caip25CaveatValue } from '@metamask/chain-agnostic-permission';

/**
 * Switch chain implementation to be used in JsonRpcEngine middleware.
 *
 * @param params.req - The JsonRpcEngine request.
 * @param params.res - The JsonRpcEngine result object.
 * @param params.requestUserApproval - The callback to trigger user approval flow.
 * @param params.analytics - Analytics parameters to be passed when tracking event via `MetaMetrics`.
 * @param params.hooks - Method hooks passed to the method implementation.
 * @returns {void}.
 */
type SwitchHooks = {
  getNetworkConfigurationByChainId: (chainId: string) => unknown;
  getCurrentChainIdForDomain: (origin: string) => string;
  getCaveat?: (args: { target: string; caveatType: string }) => { value: Caip25CaveatValue } | undefined;
  requestPermittedChainsPermissionIncrementalForOrigin?: (args: { origin: string; chainId: `0x${string}`; autoApprove: boolean }) => Promise<void>;
  hasApprovalRequestsForOrigin?: () => unknown;
  rejectApprovalRequestsForOrigin?: () => void;
  toNetworkConfiguration?: unknown;
  fromNetworkConfiguration?: unknown;
  [key: string]: unknown;
};

export const wallet_switchEthereumChain = async ({
  req,
  res,
  requestUserApproval,
  analytics,
  hooks,
}: {
  req: JsonRpcRequest<Json[]> & { origin: string };
  res: PendingJsonRpcResponse<Json>;
  requestUserApproval: (params: { type?: string; requestData?: Record<string, unknown> }) => Promise<unknown>;
  analytics?: Record<string, unknown>;
  hooks: SwitchHooks;
}): Promise<void> => {
  const {
    CurrencyRateController,
    NetworkController,
    MultichainNetworkController,
    SelectedNetworkController,
  } = Engine.context;
  const params = req.params?.[0];
  const { origin } = req;
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw rpcErrors.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        req.params,
      )}`,
    });
  }
  const { chainId } = params as { chainId: unknown };
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
    } = NetworkController.getNetworkClientById(
      currentDomainSelectedNetworkClientId,
    ) || { configuration: {} };

    if (currentDomainSelectedChainId === _chainId) {
      res.result = null;
      return;
    }

    const currentChainIdForOrigin = hooks.getCurrentChainIdForDomain(origin);

    const fromNetworkConfiguration = hooks.getNetworkConfigurationByChainId(
      currentChainIdForOrigin,
    );

    const toNetworkConfiguration =
      hooks.getNetworkConfigurationByChainId(chainId as string);

    await switchToNetwork({
      network: existingNetwork,
      chainId: _chainId,
      controllers: {
        CurrencyRateController,
        MultichainNetworkController,
        SelectedNetworkController,
      },
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

export const switchEthereumChainHandler = {
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
