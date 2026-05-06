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

interface JsonRpcRequestLike {
  origin?: string;
  params?: unknown;
}

interface JsonRpcResponseLike {
  result?: unknown;
}

interface SwitchEthereumChainHooks {
  getCurrentChainIdForDomain: (origin: string) => string;
  getNetworkConfigurationByChainId: (chainId: string) => unknown;
  [hook: string]: unknown;
}

interface WalletSwitchEthereumChainParams {
  req: JsonRpcRequestLike;
  res: JsonRpcResponseLike;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestUserApproval: (req: any) => Promise<unknown>;
  analytics?: Record<string, unknown>;
  hooks: SwitchEthereumChainHooks;
}

/**
 * Switch chain implementation to be used in JsonRpcEngine middleware.
 */
export const wallet_switchEthereumChain = async ({
  req,
  res,
  requestUserApproval,
  analytics,
  hooks,
}: WalletSwitchEthereumChainParams): Promise<void> => {
  const { NetworkController, SelectedNetworkController } = Engine.context;
  const params = (req.params as ({ chainId?: unknown } | undefined)[])?.[0];
  const { origin } = req;
  if (!params || typeof params !== 'object') {
    throw rpcErrors.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        req.params,
      )}`,
    });
  }
  const { chainId } = params;
  const allowedKeys: Record<string, true> = {
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
  const existingNetwork = findExistingNetwork(
    _chainId,
    networkConfigurations as Parameters<typeof findExistingNetwork>[1],
  );
  if (existingNetwork) {
    const currentDomainSelectedNetworkClientId =
      SelectedNetworkController.getNetworkClientIdForDomain(origin ?? '');
    const networkClient = NetworkController.getNetworkClientById(
      currentDomainSelectedNetworkClientId,
    );
    const currentDomainSelectedChainId = (
      networkClient as { configuration?: { chainId?: string } } | undefined
    )?.configuration?.chainId;

    if (currentDomainSelectedChainId === _chainId) {
      res.result = null;
      return;
    }

    const currentChainIdForOrigin = hooks.getCurrentChainIdForDomain(
      origin ?? '',
    );

    const fromNetworkConfiguration = hooks.getNetworkConfigurationByChainId(
      currentChainIdForOrigin,
    );

    const toNetworkConfiguration = hooks.getNetworkConfigurationByChainId(
      chainId as string,
    );

    await switchToNetwork({
      network: existingNetwork,
      chainId: _chainId,
      requestUserApproval,
      analytics,
      origin: origin ?? '',
      isAddNetworkFlow: false,
      hooks: {
        ...(hooks as unknown as Parameters<typeof switchToNetwork>[0]['hooks']),
        toNetworkConfiguration,
        fromNetworkConfiguration,
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
