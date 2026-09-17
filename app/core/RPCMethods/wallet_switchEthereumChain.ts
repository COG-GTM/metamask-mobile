import Engine from '../Engine';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import type {
  Hex,
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import type { NetworkConfiguration } from '@metamask/network-controller';
import { selectEvmNetworkConfigurationsByChainId } from '../../selectors/networkController';
import { store } from '../../store';
import {
  validateChainId,
  findExistingNetwork,
  switchToNetwork,
  type RequestUserApproval,
  type SwitchToNetworkHooks,
} from './lib/ethereum-chain-utils';
import { MESSAGE_TYPE } from '../createTracingMiddleware';

/**
 * Method hooks passed to the `wallet_switchEthereumChain` implementation.
 */
export interface SwitchEthereumChainHooks extends SwitchToNetworkHooks {
  getCurrentChainIdForDomain: (domain: string) => Hex;
  getNetworkConfigurationByChainId: (
    chainId: Hex,
  ) => NetworkConfiguration | undefined;
}

interface WalletSwitchEthereumChainOptions {
  req: JsonRpcRequest<JsonRpcParams> & { origin: string };
  res: PendingJsonRpcResponse<Json>;
  requestUserApproval: RequestUserApproval;
  analytics: Record<string, unknown>;
  hooks: SwitchEthereumChainHooks;
}

/**
 * Switch chain implementation to be used in JsonRpcEngine middleware.
 *
 * @param options - The options object.
 * @param options.req - The JsonRpcEngine request.
 * @param options.res - The JsonRpcEngine result object.
 * @param options.requestUserApproval - The callback to trigger user approval flow.
 * @param options.analytics - Analytics parameters to be passed when tracking event via `MetaMetrics`.
 * @param options.hooks - Method hooks passed to the method implementation.
 * @returns Nothing.
 */
export const wallet_switchEthereumChain = async ({
  req,
  res,
  requestUserApproval,
  analytics,
  hooks,
}: WalletSwitchEthereumChainOptions): Promise<void> => {
  const { NetworkController, SelectedNetworkController } = Engine.context;
  const requestParams = req.params as unknown;
  const params = Array.isArray(requestParams) ? requestParams[0] : undefined;
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
    const currentDomainSelectedChainId = NetworkController.getNetworkClientById(
      currentDomainSelectedNetworkClientId,
    )?.configuration?.chainId;

    if (currentDomainSelectedChainId === _chainId) {
      res.result = null;
      return;
    }

    const currentChainIdForOrigin = hooks.getCurrentChainIdForDomain(origin);

    const fromNetworkConfiguration = hooks.getNetworkConfigurationByChainId(
      currentChainIdForOrigin,
    );

    const toNetworkConfiguration =
      hooks.getNetworkConfigurationByChainId(chainId as Hex);

    await switchToNetwork({
      network: existingNetwork,
      chainId: _chainId,
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
