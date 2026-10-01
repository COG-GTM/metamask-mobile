import { toHex } from '@metamask/controller-utils';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import { CaipChainId, KnownCaipNamespace } from '@metamask/utils';
import { NavigationContainerRef } from '@react-navigation/native';
import { RelayerTypes } from '@walletconnect/types';
import { parseRelayParams } from '@walletconnect/utils';
import qs from 'qs';
import Routes from '../../../app/constants/navigation/Routes';
import { store } from '../../../app/store';
import {
  selectNetworkConfigurations,
  selectProviderConfig,
} from '../../selectors/networkController';
import Engine from '../Engine';
import { getPermittedAccounts, getPermittedChains, removePermittedChain, updatePermittedChains } from '../Permissions';
import {
  findExistingNetwork,
  switchToNetwork,
} from '../RPCMethods/lib/ethereum-chain-utils';
import { getRpcMethodMiddlewareHooks } from '../RPCMethods/RPCMethodMiddleware';
import DevLogger from '../SDKConnect/utils/DevLogger';
import { wait } from '../SDKConnect/utils/wait.util';

export interface WCMultiVersionParams {
  protocol: string;
  version: number;
  topic: string;
  // v2 params
  symKey?: string;
  relay?: RelayerTypes.ProtocolOptions;
  // v1 params
  bridge?: string;
  key?: string;
  handshakeTopic?: string;
}

export const getHostname = (uri: string): string => {
  try {
    // Handle empty or invalid URIs
    if (!uri) return '';

    // For standard URLs, use URL API
    if (uri.includes('://')) {
      try {
        const url = new URL(uri);
        return url.hostname;
      } catch (e) {
        // If URL parsing fails, continue with manual parsing
      }
    }

    // For protocol-based URIs like wc: or ethereum:
    const pathStart: number = uri.indexOf(':');
    if (pathStart !== -1) {
      return uri.substring(0, pathStart);
    }

    // If no protocol separator found, return the original string
    return uri;
  } catch (error) {
    DevLogger.log('Error in getHostname:', error);
    return uri;
  }
};

/**
 * Scheme used to namespace WalletConnect permission subjects.
 *
 * A WalletConnect dApp identity comes from the self-asserted, attacker
 * controllable `session.peer.metadata.url`. Keying permissions on the bare
 * hostname (e.g. `app.uniswap.org`) lets a malicious WalletConnect dApp reuse
 * the exact same permission subject as the in-app browser, inheriting any
 * account/chain grants the user trusts in the browser. Prefixing the subject
 * keeps WalletConnect grants in a namespace that can never collide with
 * in-app-browser origins.
 */
export const WALLET_CONNECT_ORIGIN_PREFIX = 'walletconnect://';

/**
 * Derive the permission subject used for a WalletConnect session.
 *
 * The result is namespaced with {@link WALLET_CONNECT_ORIGIN_PREFIX} so that
 * WalletConnect permissions are stored and looked up in a dedicated namespace,
 * isolated from the in-app browser which keys permissions on the bare hostname.
 * The function is idempotent: passing an already-namespaced origin returns the
 * same subject.
 *
 * @param origin - The dApp origin (typically `session.peer.metadata.url`).
 * @returns The namespaced permission subject, or an empty string if no hostname
 * can be derived.
 */
export const getWalletConnectPermissionSubject = (origin: string): string => {
  const hostname = getHostname(origin);
  if (!hostname) return '';
  return `${WALLET_CONNECT_ORIGIN_PREFIX}${hostname}`;
};

/**
 * Result of the WalletConnect Verify API for a given session/request.
 * Mirrors the relevant fields of `verifyContext.verified`.
 */
export interface WalletConnectVerifiedContext {
  validation?: string;
  isScam?: boolean;
  origin?: string;
}

export const WC_VERIFY_VALIDATION = {
  VALID: 'VALID',
  INVALID: 'INVALID',
  UNKNOWN: 'UNKNOWN',
} as const;

/**
 * Determine whether a WalletConnect Verify API result must not be trusted.
 *
 * The `peer.metadata.url` is self-asserted and spoofable, so before granting or
 * exercising permissions we consult the Verify API result. An origin flagged as
 * a scam or whose attestation failed validation (`INVALID`) is rejected.
 *
 * @param verified - The `verifyContext.verified` object from a proposal/request.
 * @returns `true` when the origin is a known scam or failed validation.
 */
export const isUntrustedWalletConnectOrigin = (
  verified?: WalletConnectVerifiedContext | null,
): boolean =>
  Boolean(
    verified &&
      (verified.isScam === true ||
        verified.validation === WC_VERIFY_VALIDATION.INVALID),
  );

export const parseWalletConnectUri = (uri: string): WCMultiVersionParams => {
  // Handle wc:{} and wc://{} format
  const str = uri.startsWith('wc://') ? uri.replace('wc://', 'wc:') : uri;
  const pathStart: number = str.indexOf(':');
  const pathEnd: number | undefined =
    str.indexOf('?') !== -1 ? str.indexOf('?') : undefined;
  const protocol = str.substring(0, pathStart);
  const path: string = str.substring(pathStart + 1, pathEnd);
  const requiredValues = path.split('@');

  const queryString: string =
    typeof pathEnd !== 'undefined' ? str.substring(pathEnd) : '';
  const queryParams = qs.parse(queryString);
  const result = {
    protocol,
    topic: requiredValues[0],
    version: Number.parseInt(requiredValues[1], 10),
    symKey: queryParams.symKey as string,
    relay: parseRelayParams(queryParams),
    bridge: queryParams.bridge as string,
    key: queryParams.key as string,
    handshakeTopic: queryParams.handshakeTopic as string,
  };

  return result;
};

export const hideWCLoadingState = ({
  navigation,
}: {
  navigation?: NavigationContainerRef;
}): void => {
  const currentRoute = navigation?.getCurrentRoute()?.name;
  if (currentRoute === Routes.SHEET.SDK_LOADING && navigation?.canGoBack()) {
    navigation?.goBack();
  } else if (
    currentRoute === Routes.SHEET.RETURN_TO_DAPP_MODAL &&
    navigation?.canGoBack()
  ) {
    // also close return to dapp if it wasnt previously closed
    navigation?.goBack();
  }
};

export const showWCLoadingState = ({
  navigation,
}: {
  navigation?: NavigationContainerRef;
}): void => {
  navigation?.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
    screen: Routes.SHEET.SDK_LOADING,
  });
};

export const isValidWCURI = (uri: string): boolean => {
  const result = parseWalletConnectUri(uri);
  if (result.version === 1) {
    return !(!result.handshakeTopic || !result.bridge || !result.key);
  } else if (result.version === 2) {
    return !(!result.topic || !result.symKey || !result.relay);
  }
  return false;
};

// Export a config object that can be modified for testing
export const networkModalOnboardingConfig = {
  MAX_LOOP_COUNTER: 60,
};

export const waitForNetworkModalOnboarding = async ({
  chainId,
}: {
  chainId: string;
}): Promise<void> => {
  let waitForNetworkModalOnboarded = true;

  // throw timeout error after 30sec
  let loopCounter = 0;

  while (waitForNetworkModalOnboarded) {
    loopCounter += 1;
    const { networkOnboarded } = store.getState();
    const { networkOnboardedState } = networkOnboarded;

    if (networkOnboardedState[chainId]) {
      waitForNetworkModalOnboarded = false;
      // exit the loop
    } else {
      await wait(1000);
    }

    if (loopCounter >= networkModalOnboardingConfig.MAX_LOOP_COUNTER) {
      throw new Error('Timeout error');
    }
  }
};

export const getApprovedSessionMethods = (_: { origin: string }): string[] => {
  const allEIP155Methods = [
    // Standard JSON-RPC methods
    'eth_sendTransaction',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
    'personal_sign',
    'eth_sendRawTransaction',
    'eth_accounts',
    'eth_getBalance',
    'eth_call',
    'eth_estimateGas',
    'eth_blockNumber',
    'eth_getCode',
    'eth_getTransactionCount',
    'eth_getTransactionReceipt',
    'eth_getTransactionByHash',
    'eth_getBlockByHash',
    'eth_getBlockByNumber',
    'net_version',
    'eth_chainId',
    'eth_requestAccounts',

    // MetaMask specific methods
    'wallet_addEthereumChain',
    'wallet_switchEthereumChain',
    'wallet_getPermissions',
    'wallet_requestPermissions',
    'wallet_watchAsset',
    'wallet_scanQRCode',
  ];

  // TODO: extract from the permissions controller when implemented
  return allEIP155Methods;
};

export const getScopedPermissions = async ({ origin }: { origin: string }) => {
  // Namespace the subject so WalletConnect permissions can never inherit grants
  // from the in-app browser, which keys permissions on the bare hostname.
  const subject = getWalletConnectPermissionSubject(origin);
  const approvedAccounts = getPermittedAccounts(subject);
  const chains = await getPermittedChains(subject);

  DevLogger.log(
    `WC::getScopedPermissions for ${origin}, found accounts:`,
    approvedAccounts,
  );

  DevLogger.log(
    `WC::getScopedPermissions for ${origin}, found chains:`,
    chains,
  );

  // Create properly formatted account strings for each chain and account
  const accountsPerChains = chains.flatMap((chain) =>
    Array.isArray(approvedAccounts)
      ? approvedAccounts.map((account) => `${chain}:${account}`)
      : []
  );

  const scopedPermissions = {
    chains,
    methods: getApprovedSessionMethods({ origin }),
    events: ['chainChanged', 'accountsChanged'],
    accounts: accountsPerChains,
  };

  DevLogger.log(
    `WC::getScopedPermissions final permissions`,
    scopedPermissions,
  );
  return {
    [KnownCaipNamespace.Eip155]: scopedPermissions,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onRequestUserApproval = (origin: string) => async (args: any) => {
  Engine.context.ApprovalController.clear(
    providerErrors.userRejectedRequest(),
  );
  const responseData = await Engine.context.ApprovalController.add({
    origin,
    type: args.type,
    requestData: args.requestData,
  });
  return responseData;
};

export const checkWCPermissions = async ({
  origin,
  caip2ChainId,
  allowSwitchingToNewChain = false,
}: { origin: string; caip2ChainId: CaipChainId; allowSwitchingToNewChain?: boolean }) => {
  const networkConfigurations = selectNetworkConfigurations(store.getState());
  const decimalChainId = caip2ChainId.split(':')[1];
  const hexChainIdString = toHex(`0x${parseInt(decimalChainId, 10).toString(16)}`);

  const existingNetwork = findExistingNetwork(
    hexChainIdString,
    networkConfigurations,
  );

  if (!existingNetwork) {
    DevLogger.log(`WC::checkWCPermissions no existing network found`);
    throw rpcErrors.invalidParams({
      message: `Invalid parameters: active chainId is different than the one provided.`,
    });
  }

  // Namespace the subject so WalletConnect chain permissions can never inherit
  // grants from the in-app browser, which keys permissions on the bare hostname.
  const subject = getWalletConnectPermissionSubject(origin);
  const permittedChains = await getPermittedChains(subject);
  const isAllowedChainId = permittedChains.includes(caip2ChainId);

  DevLogger.log(`WC::checkWCPermissions permittedChains: ${permittedChains}`);

  const providerConfig = selectProviderConfig(store.getState());
  const activeChainIdHex = providerConfig.chainId;
  const activeCaip2ChainId = `${KnownCaipNamespace.Eip155}:${parseInt(
    activeChainIdHex,
    16,
  )}`;

  DevLogger.log(
    `WC::checkWCPermissions origin=${origin} caip2ChainId=${caip2ChainId} activeCaip2ChainId=${activeCaip2ChainId} permittedChains=${permittedChains} isAllowedChainId=${isAllowedChainId}`,
  );

  // If the chainId is not permitted and we're not allowed to switch to a new chain, throw an error
  if (!isAllowedChainId && !allowSwitchingToNewChain) {
    DevLogger.log(`WC::checkWCPermissions chainId is not permitted`);
    throw rpcErrors.invalidParams({
      message: `Invalid parameters: active chainId is different than the one provided.`,
    });
  }

  DevLogger.log(
    `WC::checkWCPermissions switching to network:`,
    existingNetwork,
  );

  if (caip2ChainId !== activeCaip2ChainId) {
    try {
      if (!isAllowedChainId && allowSwitchingToNewChain) {
        // Preemptively add the chain to the permitted chains
        // This is to prevent a race condition where WalletConnect is told about the chain switch before permissions are updated
        DevLogger.log(`WC::checkWCPermissions adding permitted chain for ${subject}:`, hexChainIdString);
        updatePermittedChains(subject, [hexChainIdString]);
      }

      await switchToNetwork({
        network: existingNetwork,
        chainId: hexChainIdString,
        requestUserApproval: onRequestUserApproval(origin),
        analytics: {},
        origin,
        isAddNetworkFlow: false,
        hooks: getRpcMethodMiddlewareHooks(origin),
      });
    } catch (error) {
      DevLogger.log(
        `WC::checkWCPermissions error switching to network:`,
        error,
      );

      if (!isAllowedChainId && allowSwitchingToNewChain) {
        // If we failed to switch to the network, remove the chain from the permitted chains
        // This is so we don't leave any dangling permissions if the user rejects the switch
        DevLogger.log(`WC::checkWCPermissions removing permitted chain for ${subject}:`, hexChainIdString);
        removePermittedChain(subject, hexChainIdString);
      }

      return false;
    }
  }

  return true;
};
