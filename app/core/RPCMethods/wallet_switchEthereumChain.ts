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
import { Hex } from '@metamask/utils';
import { NetworkConfiguration } from '@metamask/network-controller';
import { Caip25CaveatValue } from '@metamask/chain-agnostic-permission';

export interface WalletSwitchEthereumChainHooks {
  getCurrentChainIdForDomain: (origin: string) => Hex;
  getNetworkConfigurationByChainId: (chainId: Hex) => NetworkConfiguration | undefined;
  getCaveat: (params: { target: string; caveatType: string }) => { value: Caip25CaveatValue } | undefined;
  requestPermittedChainsPermissionIncrementalForOrigin: (params: { origin: string; chainId: Hex; autoApprove: boolean }) => Promise<void>;
  setActiveNetwork?: (networkClientId: string) => Promise<void>;
  requestUserApproval?: (params: { type: string; requestData: Record<string, unknown> }) => Promise<void>;
  setTokenNetworkFilter?: (filter: Record<string, boolean>) => void;
  hasApprovalRequestsForOrigin: () => boolean;
  rejectApprovalRequestsForOrigin?: () => void;
  toNetworkConfiguration?: NetworkConfiguration | ((chainId: Hex) => NetworkConfiguration | undefined);
  fromNetworkConfiguration?: NetworkConfiguration;
}

interface WalletSwitchEthereumChainParams {
  req: { params: unknown[] | null; origin?: string };
  res: { result: unknown };
  requestUserApproval: (params: { type: string; requestData: Record<string, unknown>; origin?: string }) => Promise<void>;
  analytics?: Record<string, string | boolean | undefined>;
  hooks: WalletSwitchEthereumChainHooks;
}

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
export const wallet_switchEthereumChain = async ({
  req,
  res,
  requestUserApproval,
  analytics,
  hooks,
}: WalletSwitchEthereumChainParams): Promise<void> => {
  const {
    NetworkController,
    SelectedNetworkController,
  } = Engine.context;
  const params = req.params?.[0] as Record<string, unknown> | undefined;
  const { origin } = req;
  if (!params || typeof params !== 'object') {
    throw rpcErrors.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        req.params,
      )}`,
    });
  }
  const { chainId } = params;
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
      SelectedNetworkController.getNetworkClientIdForDomain(origin as string);
    const {
      configuration: { chainId: currentDomainSelectedChainId },
    } = NetworkController.getNetworkClientById(
      currentDomainSelectedNetworkClientId,
    ) || { configuration: {} as Record<string, unknown> };

    if (currentDomainSelectedChainId === _chainId) {
      res.result = null;
      return;
    }

    const currentChainIdForOrigin = hooks.getCurrentChainIdForDomain(origin as string);

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
      origin: origin as string,
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
