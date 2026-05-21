/* eslint-disable import/no-commonjs */
// eslint-disable-next-line @typescript-eslint/no-shadow
import URL from 'url-parse';
import {
  createSelectedNetworkMiddleware,
  METAMASK_DOMAIN,
} from '@metamask/selected-network-controller';
import EthQuery from '@metamask/eth-query';
import { JsonRpcEngine, JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams } from '@metamask/utils';
import MobilePortStream from '../MobilePortStream';
import { setupMultiplex } from '../../util/streams';
import {
  createOriginMiddleware,
  createLoggerMiddleware,
} from '../../util/middlewares';
import Engine from '../Engine';
import { createSanitizationMiddleware } from '../SanitizationMiddleware';
import Logger from '../../util/Logger';
import AppConstants from '../AppConstants';
import RemotePort from './RemotePort';
import WalletConnectPort from './WalletConnectPort';
import Port from './Port';
import { store } from '../../store';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import { rpcErrors } from '@metamask/rpc-errors';
import snapMethodMiddlewareBuilder from '../Snaps/SnapsMethodMiddleware';
import { SubjectType } from '@metamask/permission-controller';
///: END:ONLY_INCLUDE_IF

import { createEngineStream } from '@metamask/json-rpc-middleware-stream';
const createFilterMiddleware = require('@metamask/eth-json-rpc-filters');
const createSubscriptionManager = require('@metamask/eth-json-rpc-filters/subscriptionManager');
import { providerAsMiddleware } from '@metamask/eth-json-rpc-middleware';
const pump = require('pump');
// eslint-disable-next-line import/no-nodejs-modules
const EventEmitter = require('events').EventEmitter;
const { NOTIFICATION_NAMES } = AppConstants;
import DevLogger from '../SDKConnect/utils/DevLogger';
import { getPermittedAccounts } from '../Permissions';
import { NetworkStatus } from '@metamask/network-controller';
import { NETWORK_ID_LOADING } from '../redux/slices/inpageProvider';
import createUnsupportedMethodMiddleware from '../RPCMethods/createUnsupportedMethodMiddleware';
import createEthAccountsMethodMiddleware from '../RPCMethods/createEthAccountsMethodMiddleware';
import createTracingMiddleware from '../createTracingMiddleware';
import { createEip1193MethodMiddleware } from '../RPCMethods/createEip1193MethodMiddleware';
import { getCaip25PermissionFromLegacyPermissions } from '../../util/permissions';

interface WcRequestActions {
  approveRequest: (args: { id: number; result: string }) => void;
  rejectRequest: (args: { id: number; error: unknown }) => void;
  updateSession: (args: { chainId: number; accounts: string[] }) => void;
}

interface BackgroundBridgeParams {
  webview: { current: unknown } | null;
  url: string;
  getRpcMethodMiddleware: (args: {
    hostname: string;
    getProviderState: (origin?: string) => Promise<{
      isUnlocked: boolean;
      chainId: string;
      networkVersion: string;
    }>;
  }) => JsonRpcMiddleware<JsonRpcParams, Json>;
  isMainFrame: boolean;
  isRemoteConn: boolean;
  sendMessage?: () => void;
  isWalletConnect: boolean;
  wcRequestActions?: WcRequestActions;
  getApprovedHosts?: (() => string[]) | ((host: string) => Record<string, boolean>);
  remoteConnHost?: string;
  isMMSDK?: boolean;
  channelId?: string;
}

const legacyNetworkId = () => {
  const { networksMetadata, selectedNetworkClientId } =
    store.getState().engine.backgroundState.NetworkController;

  const { networkId } = store.getState().inpageProvider;

  return networksMetadata?.[selectedNetworkClientId].status !==
    NetworkStatus.Available
    ? NETWORK_ID_LOADING
    : networkId;
};

export class BackgroundBridge extends EventEmitter {
  url: string;
  hostname: string;
  remoteConnHost: string | undefined;
  isMainFrame: boolean;
  isWalletConnect: boolean;
  isMMSDK: boolean | undefined;
  isRemoteConn: boolean;
  _webviewRef: unknown;
  disconnected: boolean;
  getApprovedHosts: ((...args: unknown[]) => unknown) | undefined;
  channelId: string | undefined;
  deprecatedNetworkVersions: Record<string, string | null>;
  createMiddleware: BackgroundBridgeParams['getRpcMethodMiddleware'];
  port: RemotePort | WalletConnectPort | Port;
  engine: JsonRpcEngine | null;
  lastChainIdSent: string;
  networkVersionSent: string;
  addressSent: string;

  constructor({
    webview,
    url,
    getRpcMethodMiddleware,
    isMainFrame,
    isRemoteConn,
    sendMessage,
    isWalletConnect,
    wcRequestActions,
    getApprovedHosts,
    remoteConnHost,
    isMMSDK,
    channelId,
  }: BackgroundBridgeParams) {
    super();
    this.url = url;
    // TODO - When WalletConnect and MMSDK uses the Permission System, URL does not apply in all conditions anymore since hosts may not originate from web. This will need to change!
    this.hostname = new URL(url).hostname;
    this.remoteConnHost = remoteConnHost;
    this.isMainFrame = isMainFrame;
    this.isWalletConnect = isWalletConnect;
    this.isMMSDK = isMMSDK;
    this.isRemoteConn = isRemoteConn;
    this._webviewRef = webview?.current;
    this.disconnected = false;
    this.getApprovedHosts = getApprovedHosts as ((...args: unknown[]) => unknown) | undefined;
    this.channelId = channelId;
    this.deprecatedNetworkVersions = {};

    this.createMiddleware = getRpcMethodMiddleware;

    this.port = isRemoteConn
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ? new RemotePort(sendMessage!)
      : this.isWalletConnect
      ? new WalletConnectPort(wcRequestActions)
      : new Port(this._webviewRef, isMainFrame);

    this.engine = null;

    const networkClientId = Engine.controllerMessenger.call(
      'SelectedNetworkController:getNetworkClientIdForDomain',
      this.hostname,
    );

    const networkClient = Engine.controllerMessenger.call(
      'NetworkController:getNetworkClientById',
      networkClientId,
    );

    this.lastChainIdSent = networkClient.configuration.chainId;

    this.networkVersionSent = parseInt(
      networkClient.configuration.chainId,
      16,
    ).toString();

    // This will only be used for WalletConnect for now
    this.addressSent =
      Engine.context.AccountsController.getSelectedAccount().address.toLowerCase();

    // Port types are structurally compatible but nominally different
    const portStream = new MobilePortStream(this.port as unknown as ConstructorParameters<typeof MobilePortStream>[0], url);
    // setup multiplexing
    const mux = setupMultiplex(portStream);
    // connect features
    this.setupProviderConnection(
      mux.createStream(
        isWalletConnect ? 'walletconnect-provider' : 'metamask-provider',
      ),
    );

    Engine.controllerMessenger.subscribe(
      AppConstants.NETWORK_STATE_CHANGE_EVENT,
      this.sendStateUpdate,
    );

    Engine.controllerMessenger.subscribe(
      'PreferencesController:stateChange',
      this.sendStateUpdate,
    );

    Engine.controllerMessenger.subscribe(
      'SelectedNetworkController:stateChange',
      this.sendStateUpdate,
    );

    Engine.controllerMessenger.subscribe(
      'KeyringController:lock',
      this.onLock.bind(this),
    );
    Engine.controllerMessenger.subscribe(
      'KeyringController:unlock',
      this.onUnlock.bind(this),
    );

    try {
      const pc = Engine.context.PermissionController;
      const controllerMessenger = Engine.controllerMessenger;
      controllerMessenger.subscribe(
        `${pc.name}:stateChange`,
        (subjectWithPermission: unknown) => {
          DevLogger.log(
            `PermissionController:stateChange event`,
            subjectWithPermission,
          );
          // Inform dapp about updated permissions
          const selectedAddress = this.getState().selectedAddress;
          this.notifySelectedAddressChanged(selectedAddress);
        },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (state: { subjects: Record<string, unknown> }) => state.subjects[this.channelId!],
      );
    } catch (err) {
      DevLogger.log(`Error in BackgroundBridge: ${err}`);
    }

    this.on('update', () => this.onStateUpdate());

    if (this.isRemoteConn) {
      const memState = this.getState();
      const selectedAddress = memState.selectedAddress;
      this.notifyChainChanged();
      this.notifySelectedAddressChanged(selectedAddress);
    }
  }

  onUnlock() {
    // TODO UNSUBSCRIBE EVENT INSTEAD
    if (this.disconnected) return;

    if (this.isRemoteConn) {
      // Not sending the lock event in case of a remote connection as this is handled correctly already by the SDK
      // In case we want to send, use  new structure
      /*const memState = this.getState();
      const selectedAddress = memState.selectedAddress;

      this.sendNotification({
        method: NOTIFICATION_NAMES.unlockStateChanged,
        params: {
          isUnlocked: true,
          accounts: [selectedAddress],
        },
      });*/
      return;
    }

    this.sendNotification({
      method: NOTIFICATION_NAMES.unlockStateChanged,
      params: true,
    });
  }

  onLock() {
    // TODO UNSUBSCRIBE EVENT INSTEAD
    if (this.disconnected) return;

    if (this.isRemoteConn) {
      // Not sending the lock event in case of a remote connection as this is handled correctly already by the SDK
      // In case we want to send, use  new structure
      /*this.sendNotification({
        method: NOTIFICATION_NAMES.unlockStateChanged,
        params: {
          isUnlocked: false,
        },
      });*/
      return;
    }

    this.sendNotification({
      method: NOTIFICATION_NAMES.unlockStateChanged,
      params: false,
    });
  }

  async getProviderNetworkState(origin: string = METAMASK_DOMAIN): Promise<{
    chainId: string;
    networkVersion: string;
  }> {
    const networkClientId = Engine.controllerMessenger.call(
      'SelectedNetworkController:getNetworkClientIdForDomain',
      origin,
    );

    const networkClient = Engine.controllerMessenger.call(
      'NetworkController:getNetworkClientById',
      networkClientId,
    );

    const { chainId } = networkClient.configuration;

    let networkVersion = this.deprecatedNetworkVersions[networkClientId];
    if (!networkVersion) {
      const ethQuery = new EthQuery(networkClient.provider);
      networkVersion = await new Promise<string | null>((resolve) => {
        ethQuery.sendAsync(
          { method: 'net_version' },
          (...args: [unknown, undefined] | [null, string]) => {
            if (args[0]) {
              console.error(args[0]);
              resolve(null);
            } else {
              resolve(args[1] as string);
            }
          },
        );
      });
      this.deprecatedNetworkVersions[networkClientId] = networkVersion;
    }

    return {
      chainId,
      networkVersion: networkVersion ?? 'loading',
    };
  }

  async notifyChainChanged(params?: {
    chainId: string;
    networkVersion: string;
  }) {
    DevLogger.log(`notifyChainChanged: `, params);
    this.sendNotification({
      method: NOTIFICATION_NAMES.chainChanged,
      params: params ?? (await this.getProviderNetworkState(this.hostname)),
    });
  }

  async notifySelectedAddressChanged(selectedAddress: string) {
    try {
      let approvedAccounts: string[] = [];
      DevLogger.log(
        `notifySelectedAddressChanged: ${selectedAddress} channelId=${this.channelId} wc=${this.isWalletConnect} url=${this.url}`,
      );
      if (this.isWalletConnect) {
        approvedAccounts = getPermittedAccounts(this.url);
      } else {
        approvedAccounts = getPermittedAccounts(
          this.channelId ?? this.hostname,
        );
      }
      // Check if selectedAddress is approved
      const found = approvedAccounts
        .map((addr: string) => addr.toLowerCase())
        .includes(selectedAddress.toLowerCase());

      if (found) {
        // Set selectedAddress as first value in array
        approvedAccounts = [
          selectedAddress,
          ...approvedAccounts.filter(
            (addr: string) =>
              addr.toLowerCase() !== selectedAddress.toLowerCase(),
          ),
        ];

        DevLogger.log(
          `notifySelectedAddressChanged url: ${this.url} hostname: ${this.hostname}: ${selectedAddress}`,
          approvedAccounts,
        );
        this.sendNotification({
          method: NOTIFICATION_NAMES.accountsChanged,
          params: approvedAccounts,
        });
      } else {
        DevLogger.log(
          `notifySelectedAddressChanged: selectedAddress ${selectedAddress} not found in approvedAccounts`,
          approvedAccounts,
        );
      }
    } catch (err) {
      console.error(`notifySelectedAddressChanged: ${err}`);
    }
  }

  async onStateUpdate(memState?: { selectedAddress: string }) {
    if (!memState) {
      memState = this.getState();
    }
    const publicState = await this.getProviderNetworkState(this.hostname);

    // Check if update already sent
    if (
      this.lastChainIdSent !== publicState.chainId ||
      (this.networkVersionSent !== publicState.networkVersion &&
        publicState.networkVersion !== NETWORK_ID_LOADING)
    ) {
      this.lastChainIdSent = publicState.chainId;
      this.networkVersionSent = publicState.networkVersion;
      await this.notifyChainChanged(publicState);
    }
    // ONLY NEEDED FOR WC FOR NOW, THE BROWSER HANDLES THIS NOTIFICATION BY ITSELF
    if (this.isWalletConnect || this.isRemoteConn) {
      if (
        this.addressSent?.toLowerCase() !==
        memState.selectedAddress?.toLowerCase()
      ) {
        this.addressSent = memState.selectedAddress;
        this.notifySelectedAddressChanged(memState.selectedAddress);
      }
    }
  }

  isUnlocked(): boolean {
    return Engine.context.KeyringController.isUnlocked();
  }

  async getProviderState(origin?: string): Promise<{
    isUnlocked: boolean;
    chainId: string;
    networkVersion: string;
  }> {
    return {
      isUnlocked: this.isUnlocked(),
      ...(await this.getProviderNetworkState(origin)),
    };
  }

  sendStateUpdate = () => {
    this.emit('update');
  };

  onMessage = (msg: { name: string; data: unknown }) => {
    this.port.emit('message', { name: msg.name, data: msg.data });
  };

  onDisconnect = () => {
    this.disconnected = true;
    Engine.controllerMessenger.unsubscribe(
      AppConstants.NETWORK_STATE_CHANGE_EVENT,
      this.sendStateUpdate,
    );
    Engine.controllerMessenger.unsubscribe(
      'PreferencesController:stateChange',
      this.sendStateUpdate,
    );

    this.port.emit('disconnect', { name: this.port.name, data: null });
  };

  /**
   * A method for serving our ethereum provider over a given stream.
   * @param {*} outStream - The stream to provide over.
   */
  setupProviderConnection(outStream: unknown) {
    this.engine = this.setupProviderEngine();

    // setup connection
    const providerStream = createEngineStream({ engine: this.engine });

    pump(outStream, providerStream, outStream, (err: Error | null) => {
      // handle any middleware cleanup
      this.engine?.destroy();
      if (err) Logger.log('Error with provider stream conn', err);
    });
  }

  /**
   * A method for creating a provider that is safely restricted for the requesting domain.
   **/
  setupProviderEngine(): JsonRpcEngine {
    type Middleware = JsonRpcMiddleware<JsonRpcParams, Json>;
    const origin = (this.isMMSDK ? this.channelId : this.hostname) as string;
    // setup json rpc engine stack
    const engine = new JsonRpcEngine();

    const { KeyringController, PermissionController } = Engine.context;

    // If the origin is not in the selectedNetworkController's `domains` state
    // when the provider engine is created, the selectedNetworkController will
    // fetch the globally selected networkClient from the networkController and wrap
    // it in a proxy which can be switched to use its own state if/when the origin
    // is added to the `domains` state
    const proxyClient =
      Engine.context.SelectedNetworkController.getProviderAndBlockTracker(
        origin,
      );

    // create filter polyfill middleware
    const filterMiddleware = createFilterMiddleware(proxyClient);

    // create subscription polyfill middleware
    const subscriptionManager = createSubscriptionManager(proxyClient);
    subscriptionManager.events.on('notification', (message: unknown) =>
      engine.emit('notification', message),
    );

    // metadata
    engine.push(createOriginMiddleware({ origin }) as Middleware);
    engine.push(createSelectedNetworkMiddleware(Engine.controllerMessenger as unknown as Parameters<typeof createSelectedNetworkMiddleware>[0]) as Middleware);
    engine.push(createLoggerMiddleware({ origin }) as Middleware);
    // filter and subscription polyfills
    engine.push(filterMiddleware);
    engine.push(subscriptionManager.middleware);

    // Handle unsupported RPC Methods
    engine.push(createUnsupportedMethodMiddleware());

    // Unrestricted/permissionless RPC method implementations.
    engine.push(
      createEip1193MethodMiddleware({
        // Permission-related
        getAccounts: (options?: { ignoreLock?: boolean }) =>
          getPermittedAccounts((this.isMMSDK ? this.channelId : origin) as string, options),
        getCaip25PermissionFromLegacyPermissionsForOrigin: (
          requestedPermissions: Record<string, unknown>,
        ) =>
          getCaip25PermissionFromLegacyPermissions(
            origin,
            requestedPermissions,
          ),
        getPermissionsForOrigin: PermissionController.getPermissions.bind(
          PermissionController,
          origin,
        ),
        requestPermissionsForOrigin: (requestedPermissions: Record<string, unknown>) =>
          PermissionController.requestPermissions(
            { origin },
            requestedPermissions as Parameters<typeof PermissionController.requestPermissions>[1],
          ),
        revokePermissionsForOrigin: (permissionKeys: string[]) => {
          try {
            PermissionController.revokePermissions({
              [origin]: permissionKeys as unknown as [string, ...string[]],
            });
          } catch (e) {
            // we dont want to handle errors here because
            // the revokePermissions api method should just
            // return `null` if the permissions were not
            // successfully revoked or if the permissions
            // for the origin do not exist
          }
        },
        // network configuration-related
        updateCaveat: PermissionController.updateCaveat.bind(
          PermissionController,
          origin,
        ),
        getUnlockPromise: () => {
          if (KeyringController.isUnlocked()) {
            return Promise.resolve();
          }
          return new Promise<void>((resolve) => {
            Engine.controllerMessenger.subscribeOnceIf(
              'KeyringController:unlock',
              resolve,
              () => true,
            );
          });
        },
      }),
    );

    // Legacy RPC methods that need to be implemented ahead of the permission middleware
    engine.push(
      createEthAccountsMethodMiddleware({
        getAccounts: (options?: { ignoreLock?: boolean }) =>
          getPermittedAccounts((this.isMMSDK ? this.channelId : origin) as string, options),
      }),
    );

    // Sentry tracing middleware
    engine.push(createTracingMiddleware());

    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
    // These Snaps RPC methods are disabled in WalletConnect and SDK for now
    if (this.isMMSDK || this.isWalletConnect) {
      engine.push(((req: { method: string }, _res: unknown, next: () => void, end: (err?: unknown) => void) => {
        if (['wallet_snap'].includes(req.method)) {
          return end(
            rpcErrors.methodNotFound({ data: { method: req.method } }),
          );
        }
        return next();
      }) as Middleware);
    }
    ///: END:ONLY_INCLUDE_IF

    // Append PermissionController middleware
    engine.push(
      Engine.context.PermissionController.createPermissionMiddleware({
        // FIXME: This condition exists so that both WC and SDK are compatible with the permission middleware.
        // This is not a long term solution. BackgroundBridge should be not contain hardcoded logic pertaining to WC, SDK, or browser.
        origin: (this.isMMSDK ? this.channelId : origin) as string,
      }),
    );

    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
    // The Snaps middleware is disabled in WalletConnect and SDK for now.
    if (!this.isMMSDK && !this.isWalletConnect) {
      engine.push(
        snapMethodMiddlewareBuilder(
          Engine.context,
          Engine.controllerMessenger,
          this.url,
          // We assume that origins connecting through the BackgroundBridge are websites
          SubjectType.Website,
        ),
      );
    }
    ///: END:ONLY_INCLUDE_IF

    // user-facing RPC methods
    engine.push(
      this.createMiddleware({
        hostname: this.hostname,
        getProviderState: this.getProviderState.bind(this),
      }),
    );

    engine.push(createSanitizationMiddleware());

    // forward to metamask primary provider
    engine.push(providerAsMiddleware(proxyClient.provider));
    return engine;
  }

  sendNotification(payload: { method: string; params: unknown }) {
    DevLogger.log(`BackgroundBridge::sendNotification: `, payload);
    this.engine?.emit('notification', payload);
  }

  /**
   * The metamask-state of the various controllers, made available to the UI
   *
   * TODO: Use controller state instead of flattened state for better auditability
   *
   * @returns {Object} status
   */
  getState(): { isInitialized: boolean; isUnlocked: boolean; network: unknown; selectedAddress: string } {
    const vault = Engine.context.KeyringController.state.vault;
    const {
      PreferencesController: { selectedAddress },
    } = Engine.datamodel.state;
    return {
      isInitialized: !!vault,
      isUnlocked: true,
      network: legacyNetworkId(),
      selectedAddress,
    };
  }
}

export default BackgroundBridge;
