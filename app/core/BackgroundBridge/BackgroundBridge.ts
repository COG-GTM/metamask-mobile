/* eslint-disable import/no-commonjs */
// eslint-disable-next-line @typescript-eslint/no-shadow
import URL from 'url-parse';
// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';
import {
  createSelectedNetworkMiddleware,
  METAMASK_DOMAIN,
} from '@metamask/selected-network-controller';
import EthQuery from '@metamask/eth-query';
import {
  JsonRpcEngine,
  JsonRpcMiddleware,
} from '@metamask/json-rpc-engine';
import { Json, JsonRpcParams } from '@metamask/utils';
import { NetworkStatus } from '@metamask/network-controller';
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
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const createFilterMiddleware = require('@metamask/eth-json-rpc-filters');
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const createSubscriptionManager = require('@metamask/eth-json-rpc-filters/subscriptionManager');
import { providerAsMiddleware } from '@metamask/eth-json-rpc-middleware';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pump = require('pump');
const { NOTIFICATION_NAMES } = AppConstants;
import DevLogger from '../SDKConnect/utils/DevLogger';
import { getPermittedAccounts } from '../Permissions';
import { NETWORK_ID_LOADING } from '../redux/slices/inpageProvider';
import createUnsupportedMethodMiddleware from '../RPCMethods/createUnsupportedMethodMiddleware';
import createEthAccountsMethodMiddleware from '../RPCMethods/createEthAccountsMethodMiddleware';
import createTracingMiddleware from '../createTracingMiddleware';
import { createEip1193MethodMiddleware } from '../RPCMethods/createEip1193MethodMiddleware';
import { getCaip25PermissionFromLegacyPermissions } from '../../util/permissions';

interface ProviderNetworkState {
  chainId: string;
  networkVersion: string;
}

interface ProviderState extends ProviderNetworkState {
  isUnlocked: boolean;
}

interface BackgroundBridgeMemState {
  isInitialized: boolean;
  isUnlocked: boolean;
  network: string;
  selectedAddress: string;
}

interface WebviewRef {
  current: { injectJavaScript?: (js: string) => void } | null;
}

type LooseFn = (...args: unknown[]) => unknown;

export interface BackgroundBridgeParams {
  webview?: WebviewRef | null;
  url?: string;
  // The middleware factory's signature varies by caller, so it is intentionally
  // typed as `unknown` and validated at the call site.
  getRpcMethodMiddleware?: unknown;
  isMainFrame?: boolean;
  isRemoteConn?: boolean;
  sendMessage?: unknown;
  isWalletConnect?: boolean;
  wcRequestActions?: unknown;
  getApprovedHosts?: unknown;
  remoteConnHost?: string;
  isMMSDK?: boolean;
  channelId?: string;
}

interface BackgroundBridgeEventPayloads {
  update: [];
  notification: [unknown];
}

const legacyNetworkId = (): string => {
  const { networksMetadata, selectedNetworkClientId } =
    store.getState().engine.backgroundState.NetworkController;

  const { networkId } = store.getState().inpageProvider;

  return networksMetadata?.[selectedNetworkClientId].status !==
    NetworkStatus.Available
    ? NETWORK_ID_LOADING
    : networkId;
};

export class BackgroundBridge extends EventEmitter {
  public url: string;
  public hostname: string;
  public remoteConnHost: string | undefined;
  public isMainFrame: boolean;
  public isWalletConnect: boolean;
  public isMMSDK: boolean;
  public isRemoteConn: boolean;
  public disconnected: boolean;
  public getApprovedHosts: LooseFn | undefined;
  public channelId: string | undefined;
  public deprecatedNetworkVersions: Record<string, string | null>;
  public createMiddleware: LooseFn | undefined;
  public port: Port | RemotePort | WalletConnectPort;
  public engine: JsonRpcEngine | null;
  public lastChainIdSent: string;
  public networkVersionSent: string;
  public addressSent: string;

  private _webviewRef: WebviewRef['current'] | undefined;

  constructor(params: BackgroundBridgeParams = {}) {
    super();
    const {
      webview,
      url = '',
      getRpcMethodMiddleware,
      isMainFrame = true,
      isRemoteConn,
      sendMessage,
      isWalletConnect,
      wcRequestActions,
      getApprovedHosts,
      remoteConnHost,
      isMMSDK,
      channelId,
    } = params;

    this.url = url;
    // TODO - When WalletConnect and MMSDK uses the Permission System, URL does not apply in all conditions anymore since hosts may not originate from web. This will need to change!
    this.hostname = url ? new URL(url).hostname : '';
    this.remoteConnHost = remoteConnHost;
    this.isMainFrame = isMainFrame;
    this.isWalletConnect = Boolean(isWalletConnect);
    this.isMMSDK = Boolean(isMMSDK);
    this.isRemoteConn = Boolean(isRemoteConn);
    this._webviewRef = webview ? webview.current ?? undefined : undefined;
    this.disconnected = false;
    this.getApprovedHosts = getApprovedHosts as LooseFn | undefined;
    this.channelId = channelId;
    this.deprecatedNetworkVersions = {};

    this.createMiddleware = getRpcMethodMiddleware as LooseFn | undefined;

    this.port = isRemoteConn
      ? new RemotePort(sendMessage as LooseFn | undefined)
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

    const portStream = new MobilePortStream(this.port, url);
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
        (state: { subjects: Record<string, unknown> }) =>
          state.subjects[this.channelId ?? ''],
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

  emit<K extends keyof BackgroundBridgeEventPayloads>(
    eventName: K,
    ...args: BackgroundBridgeEventPayloads[K]
  ): boolean;
  emit(eventName: string | symbol, ...args: unknown[]): boolean;
  emit(eventName: string | symbol, ...args: unknown[]): boolean {
    return super.emit(eventName, ...args);
  }

  on<K extends keyof BackgroundBridgeEventPayloads>(
    eventName: K,
    listener: (...args: BackgroundBridgeEventPayloads[K]) => void,
  ): this;
  on(
    eventName: string | symbol,
    listener: (...args: unknown[]) => void,
  ): this;
  on(
    eventName: string | symbol,
    listener: (...args: unknown[]) => void,
  ): this {
    return super.on(eventName, listener);
  }

  onUnlock(): void {
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

  onLock(): void {
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

  async getProviderNetworkState(
    origin: string = METAMASK_DOMAIN,
  ): Promise<ProviderNetworkState> {
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
        ethQuery.sendAsync<[], string>(
          { method: 'net_version' },
          (...args) => {
            const [error, result] = args;
            if (error) {
              console.error(error);
              resolve(null);
            } else {
              resolve(result ?? null);
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

  async notifyChainChanged(params?: ProviderNetworkState): Promise<void> {
    DevLogger.log(`notifyChainChanged: `, params);
    this.sendNotification({
      method: NOTIFICATION_NAMES.chainChanged,
      params: params ?? (await this.getProviderNetworkState(this.hostname)),
    });
  }

  async notifySelectedAddressChanged(
    selectedAddress?: string,
  ): Promise<void> {
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
      // Match original JS behavior: throw if selectedAddress is undefined (caught below).
      const lowerSelected = (selectedAddress as string).toLowerCase();
      // Check if selectedAddress is approved
      const found = approvedAccounts
        .map((addr) => addr.toLowerCase())
        .includes(lowerSelected);

      if (found) {
        // Set selectedAddress as first value in array
        approvedAccounts = [
          selectedAddress as string,
          ...approvedAccounts.filter(
            (addr) => addr.toLowerCase() !== lowerSelected,
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

  async onStateUpdate(memState?: BackgroundBridgeMemState): Promise<void> {
    const resolvedMemState = memState ?? this.getState();
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
        resolvedMemState.selectedAddress?.toLowerCase()
      ) {
        this.addressSent = resolvedMemState.selectedAddress;
        this.notifySelectedAddressChanged(resolvedMemState.selectedAddress);
      }
    }
  }

  isUnlocked(): boolean {
    return Engine.context.KeyringController.isUnlocked();
  }

  async getProviderState(origin?: string): Promise<ProviderState> {
    return {
      isUnlocked: this.isUnlocked(),
      ...(await this.getProviderNetworkState(origin)),
    };
  }

  sendStateUpdate = (): void => {
    this.emit('update');
  };

  onMessage = (msg: Record<string, unknown>): void => {
    this.port.emit('message', { name: msg.name as string, data: msg.data });
  };

  onDisconnect = (): void => {
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
   *
   * @param outStream - The stream to provide over.
   */
  setupProviderConnection(outStream: unknown): void {
    this.engine = this.setupProviderEngine();

    // setup connection
    const providerStream = createEngineStream({ engine: this.engine });

    pump(outStream, providerStream, outStream, (err: Error | undefined) => {
      // handle any middleware cleanup
      this.engine?.destroy();
      if (err) Logger.log('Error with provider stream conn', err);
    });
  }

  /**
   * A method for creating a provider that is safely restricted for the requesting domain.
   */
  setupProviderEngine(): JsonRpcEngine {
    const origin = this.isMMSDK
      ? this.channelId ?? this.hostname
      : this.hostname;
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
    engine.push(
      createOriginMiddleware({
        origin,
      }) as unknown as JsonRpcMiddleware<JsonRpcParams, Json>,
    );
    engine.push(
      createSelectedNetworkMiddleware(
        Engine.controllerMessenger as unknown as Parameters<
          typeof createSelectedNetworkMiddleware
        >[0],
      ),
    );
    engine.push(
      createLoggerMiddleware({
        origin,
      }) as unknown as JsonRpcMiddleware<JsonRpcParams, Json>,
    );
    // filter and subscription polyfills
    engine.push(filterMiddleware);
    engine.push(subscriptionManager.middleware);

    // Handle unsupported RPC Methods
    engine.push(createUnsupportedMethodMiddleware());

    // Unrestricted/permissionless RPC method implementations.
    engine.push(
      createEip1193MethodMiddleware({
        // Permission-related
        getAccounts: (...args: unknown[]) =>
          getPermittedAccounts(
            this.isMMSDK ? this.channelId ?? origin : origin,
            ...(args as Parameters<typeof getPermittedAccounts> extends [
              unknown,
              ...infer Rest,
            ]
              ? Rest
              : []),
          ),
        getCaip25PermissionFromLegacyPermissionsForOrigin: (
          requestedPermissions: unknown,
        ) =>
          getCaip25PermissionFromLegacyPermissions(
            origin,
            requestedPermissions as Parameters<
              typeof getCaip25PermissionFromLegacyPermissions
            >[1],
          ),
        getPermissionsForOrigin: PermissionController.getPermissions.bind(
          PermissionController,
          origin,
        ),
        requestPermissionsForOrigin: (requestedPermissions: unknown) =>
          PermissionController.requestPermissions(
            { origin },
            requestedPermissions as Parameters<
              typeof PermissionController.requestPermissions
            >[1],
          ),
        revokePermissionsForOrigin: (permissionKeys: string[]) => {
          try {
            PermissionController.revokePermissions({
              [origin]: permissionKeys as unknown as Parameters<
                typeof PermissionController.revokePermissions
              >[0][string],
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
        getAccounts: (...args: unknown[]) =>
          getPermittedAccounts(
            this.isMMSDK ? this.channelId ?? origin : origin,
            ...(args as Parameters<typeof getPermittedAccounts> extends [
              unknown,
              ...infer Rest,
            ]
              ? Rest
              : []),
          ),
      }),
    );

    // Sentry tracing middleware
    engine.push(createTracingMiddleware());

    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
    // These Snaps RPC methods are disabled in WalletConnect and SDK for now
    if (this.isMMSDK || this.isWalletConnect) {
      engine.push((req, _res, next, end) => {
        if (['wallet_snap'].includes(req.method)) {
          return end(
            rpcErrors.methodNotFound({ data: { method: req.method } }),
          );
        }
        return next();
      });
    }
    ///: END:ONLY_INCLUDE_IF

    // Append PermissionController middleware
    engine.push(
      Engine.context.PermissionController.createPermissionMiddleware({
        // FIXME: This condition exists so that both WC and SDK are compatible with the permission middleware.
        // This is not a long term solution. BackgroundBridge should be not contain hardcoded logic pertaining to WC, SDK, or browser.
        origin: this.isMMSDK ? this.channelId ?? origin : origin,
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
    if (this.createMiddleware) {
      engine.push(
        this.createMiddleware({
          hostname: this.hostname,
          getProviderState: this.getProviderState.bind(this),
        }) as unknown as JsonRpcMiddleware<JsonRpcParams, Json>,
      );
    }

    engine.push(createSanitizationMiddleware());

    // forward to metamask primary provider
    engine.push(providerAsMiddleware(proxyClient.provider));
    return engine;
  }

  sendNotification(payload: unknown): void {
    DevLogger.log(`BackgroundBridge::sendNotification: `, payload);
    this.engine?.emit('notification', payload);
  }

  /**
   * The metamask-state of the various controllers, made available to the UI
   *
   * TODO: Use controller state instead of flattened state for better auditability
   *
   * @returns The flattened state available to the UI.
   */
  getState(): BackgroundBridgeMemState {
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
