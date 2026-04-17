import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { JsonRpcParams, Json } from '@metamask/utils';

/**
 * Represents a WebView ref object used by the in-app browser.
 */
export interface WebViewRef {
  current: {
    injectJavaScript: (js: string) => void;
  } | null;
}

/**
 * WalletConnect request action callbacks.
 */
export interface WCRequestActions {
  approveRequest?: (args: { id: number; result: unknown }) => void;
  rejectRequest?: (args: { id: number; error: unknown }) => void;
  updateSession?: (args: { chainId: number; accounts: string[] }) => void;
}

/**
 * Constructor parameters for BackgroundBridge.
 */
export interface BackgroundBridgeParams {
  webview: WebViewRef | null;
  url: string;
  getRpcMethodMiddleware: (args: {
    hostname: string;
    getProviderState: (
      origin?: string,
    ) => Promise<ProviderNetworkState & { isUnlocked: boolean }>;
  }) => JsonRpcMiddleware<JsonRpcParams, Json>;
  isMainFrame: boolean;
  isRemoteConn: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage?: (msg: any) => void;
  isWalletConnect: boolean;
  wcRequestActions?: WCRequestActions;
  getApprovedHosts?: (host: string) => Record<string, boolean>;
  remoteConnHost?: string;
  isMMSDK: boolean;
  channelId?: string;
}

/**
 * Shape of the provider network state returned by getProviderNetworkState.
 */
export interface ProviderNetworkState {
  chainId: string;
  networkVersion: string;
}

/**
 * Shape of the notification payload sent to dApps.
 */
export interface NotificationPayload {
  method: string;
  params: unknown;
}

/**
 * Shape of the state returned by BackgroundBridge.getState().
 */
export interface BackgroundBridgeState {
  isInitialized: boolean;
  isUnlocked: boolean;
  network: string;
  selectedAddress: string;
}
