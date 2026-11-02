import { NetworkController } from '@metamask/network-controller';
import { EventEmitter2 } from 'eventemitter2';
import { NativeModules } from 'react-native';
import Engine from '../../Engine';
import { RPCQueueManager } from '../RPCQueueManager';

import {
  EventType,
  MessageType,
  OriginatorInfo,
} from '@metamask/sdk-communication-layer';
import Logger from '../../../util/Logger';
import AppConstants from '../../AppConstants';

import {
  wait,
  waitForAndroidServiceBinding,
  waitForKeychainUnlocked,
} from '../utils/wait.util';

import BackgroundBridge from '../../BackgroundBridge/BackgroundBridge';
import { SDKConnect } from '../SDKConnect';

import { KeyringController } from '@metamask/keyring-controller';

import { PermissionController } from '@metamask/permission-controller';
import { PROTOCOLS } from '../../../constants/deeplinks';
import BatchRPCManager from '../BatchRPCManager';
import { DEFAULT_SESSION_TIMEOUT_MS } from '../SDKConnectConstants';
import handleCustomRpcCalls from '../handlers/handleCustomRpcCalls';
import DevLogger from '../utils/DevLogger';
import AndroidSDKEventHandler from './AndroidNativeSDKEventHandler';
import sendMessage from './AndroidService/sendMessage';
import { DappClient, DappConnections } from './dapp-sdk-types';
import getDefaultBridgeParams from './getDefaultBridgeParams';
import isDappConnectionExpired from './isDappConnectionExpired';
import { AccountsController } from '@metamask/accounts-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import Routes from '../../../constants/navigation/Routes';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { getDefaultCaip25CaveatValue } from '../../Permissions';

export default class AndroidService extends EventEmitter2 {
  public communicationClient = NativeModules.CommunicationClient;
  public connections: DappConnections = {};
  public rpcQueueManager = new RPCQueueManager();
  public bridgeByClientId: { [clientId: string]: BackgroundBridge } = {};
  public eventHandler: AndroidSDKEventHandler;
  public batchRPCManager: BatchRPCManager = new BatchRPCManager('android');
  // To keep track in order to get the associated bridge to handle batch rpc calls
  public currentClientId?: string;

  constructor() {
    super();

    this.eventHandler = new AndroidSDKEventHandler();
    this.setupEventListeners()
      .then(() => {
        DevLogger.log(
          `AndroidService::constructor event listeners setup completed`,
        );
        //
      })
      .catch((err) => {
        Logger.log(err, `AndroidService:: error setting up event listeners`);
      });
  }

  private async setupEventListeners(): Promise<void> {
    try {
      // Wait for keychain to be unlocked before handling rpc calls.
      const keyringController = (
        Engine.context as { KeyringController: KeyringController }
      ).KeyringController;
      await waitForKeychainUnlocked({
        keyringController,
        context: 'AndroidService::setupEventListener',
      });

      DevLogger.log(`AndroidService::setupEventListeners loading connections`);
      const rawConnections =
        await SDKConnect.getInstance().loadDappConnections();

      if (rawConnections) {
        Object.values(rawConnections).forEach((connection) => {
          if (isDappConnectionExpired(connection.validUntil)) {
            DevLogger.log(
              `AndroidService::setupEventListeners dropping expired client: ${connection.id}`,
            );
            this.forgetConnection(connection.id);
            return;
          }
          DevLogger.log(
            `AndroidService::setupEventListeners recover client: ${connection.id}`,
          );
          this.connections[connection.id] = {
            connected: false,
            clientId: connection.id,
            originatorInfo: connection.originatorInfo as OriginatorInfo,
            validUntil: connection.validUntil,
          };
        });
      } else {
        DevLogger.log(
          `AndroidService::setupEventListeners no previous connections found`,
        );
      }
    } catch (err) {
      console.error(`AndroidService::setupEventListeners error`, err);
    }

    this.restorePreviousConnections();

    this.setupOnClientsConnectedListener();
    this.setupOnMessageReceivedListener();

    // Bind native module to client
    await SDKConnect.getInstance().bindAndroidSDK();
  }

  public getConnections() {
    DevLogger.log(
      `AndroidService::getConnections`,
      JSON.stringify(this.connections, null, 2),
    );
    return Object.values(this.connections).filter(
      (connection) => connection?.clientId?.length > 0,
    );
  }

  private setupOnClientsConnectedListener() {
    this.eventHandler.onClientsConnected(async (sClientInfo: string) => {
      const clientInfo: DappClient = JSON.parse(sClientInfo);

      DevLogger.log(`AndroidService::clients_connected`, clientInfo);
      const existing = this.connections?.[clientInfo.clientId];
      if (existing && isDappConnectionExpired(existing.validUntil)) {
        DevLogger.log(
          `AndroidService::clients_connected - client ${clientInfo.clientId} session expired, re-approval required`,
        );
        this.forgetConnection(clientInfo.clientId);
      }

      if (this.connections?.[clientInfo.clientId]) {
        // Skip existing client -- bridge has been setup
        Logger.log(
          `AndroidService::clients_connected - existing client, sending ready`,
        );

        // Update connected state
        this.connections[clientInfo.clientId] = {
          ...this.connections[clientInfo.clientId],
          connected: true,
        };

        this.sendMessage(
          {
            type: MessageType.READY,
            data: {
              id: clientInfo?.clientId,
            },
          },
          false,
        ).catch((err) => {
          Logger.log(
            `AndroidService::clients_connected - error sending ready message to client ${clientInfo.clientId}`,
            err,
          );
        });
        return;
      }

      const handleEventAsync = async () => {
        const keyringController = (
          Engine.context as { KeyringController: KeyringController }
        ).KeyringController;

        await waitForKeychainUnlocked({
          keyringController,
          context: 'AndroidService::setupOnClientsConnectedListener',
        });

        try {
          if (!this.connections?.[clientInfo.clientId]) {
            DevLogger.log(
              `AndroidService::clients_connected - new client ${clientInfo.clientId}}`,
              this.connections,
            );
            // Ask for account permissions
            await this.checkPermission({
              originatorInfo: clientInfo.originatorInfo,
              channelId: clientInfo.clientId,
            });

            this.setupBridge(clientInfo);
            await this.saveApprovedConnection(
              clientInfo.clientId,
              clientInfo.originatorInfo,
            );
          }

          this.sendMessage(
            {
              type: MessageType.READY,
              data: {
                id: clientInfo?.clientId,
              },
            },
            false,
          ).catch((err) => {
            Logger.log(
              err,
              `AndroidService::clients_connected error sending READY message to client`,
            );
          });
        } catch (error) {
          Logger.log(
            error,
            `AndroidService::clients_connected sending jsonrpc error to client - connection rejected`,
          );
          if (!this.connections?.[clientInfo.clientId]) {
            this.forgetConnection(clientInfo.clientId);
          }
          this.sendMessage({
            data: {
              error,
              jsonrpc: '2.0',
            },
            name: 'metamask-provider',
          }).catch((err) => {
            Logger.log(
              err,
              `AndroidService::clients_connected error failed sending jsonrpc error to client`,
            );
          });
          SDKConnect.getInstance().state.navigation?.navigate(
            Routes.MODAL.ROOT_MODAL_FLOW,
            {
              screen: Routes.SHEET.RETURN_TO_DAPP_MODAL,
            },
          );
          return;
        }

        this.emit(EventType.CLIENTS_CONNECTED);
      };

      handleEventAsync().catch((err) => {
        Logger.log(
          err,
          `AndroidService::clients_connected error handling event`,
        );
      });
    });
  }

  private async checkPermission({
    channelId,
  }: {
    originatorInfo: OriginatorInfo;
    channelId: string;
  }): Promise<unknown> {
    const permissionsController = (
      Engine.context as {
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        PermissionController: PermissionController<any, any>;
      }
    ).PermissionController;

    return permissionsController.requestPermissions(
      { origin: channelId },
      {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: getDefaultCaip25CaveatValue(),
            },
          ],
        },
      },
    );
  }

  private setupOnMessageReceivedListener() {
    this.eventHandler.onMessageReceived((jsonMessage: string) => {
      const handleEventAsync = async () => {
        let parsedMsg: {
          id: string;
          message: string;
        };

        DevLogger.log(`AndroidService::onMessageReceived`, jsonMessage);
        try {
          await wait(200); // Extra wait to make sure ui is ready

          await waitForAndroidServiceBinding();
          const keyringController = (
            Engine.context as { KeyringController: KeyringController }
          ).KeyringController;
          await waitForKeychainUnlocked({
            keyringController,
            context: 'AndroidService::setupOnMessageReceivedListener',
          });
        } catch (error) {
          Logger.log(error, `AndroidService::onMessageReceived error`);
        }

        let sessionId: string,
          message: string,
          // TODO: Replace "any" with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { id: string; jsonrpc: string; method: string; params: any };
        try {
          parsedMsg = JSON.parse(jsonMessage); // handle message and redirect to corresponding bridge
          sessionId = parsedMsg.id;
          message = parsedMsg.message;
          data = JSON.parse(message);

          const known = this.connections[sessionId];
          if (known?.clientId && isDappConnectionExpired(known.validUntil)) {
            DevLogger.log(
              `AndroidService::onMessageReceived client ${sessionId} session expired, re-approval required`,
            );
            this.forgetConnection(sessionId);
            this.connections[sessionId] = {
              ...known,
              connected: true,
              validUntil: undefined,
            };
          }

          // Update connected state
          this.connections[sessionId] = {
            ...this.connections[sessionId],
            connected: true,
          };
        } catch (error) {
          Logger.log(
            error,
            `AndroidService::onMessageReceived invalid json param`,
          );
          this.sendMessage({
            data: {
              error,
              jsonrpc: '2.0',
            },
            name: 'metamask-provider',
          }).catch((err) => {
            Logger.log(
              err,
              `AndroidService::onMessageReceived error sending jsonrpc error message to client ${sessionId}`,
            );
          });
          return;
        }

        let bridge = this.bridgeByClientId[sessionId];

        if (!bridge) {
          console.warn(
            `AndroidService:: Bridge not found for client`,
            `sessionId=${sessionId} data.id=${data.id}`,
          );

          try {
            const originatorInfo = (this.connections[sessionId]
              ?.originatorInfo ?? {}) as OriginatorInfo;
            // Ask users permissions again - the channel was removed or expired
            await this.checkPermission({
              originatorInfo,
              channelId: sessionId,
            });

            await this.saveApprovedConnection(sessionId, originatorInfo);
            this.setupBridge(this.connections[sessionId]);
            bridge = this.bridgeByClientId[sessionId];
          } catch (err) {
            Logger.log(
              err,
              `AndroidService::onMessageReceived error checking permissions`,
            );
            return;
          }
        }

        const accountsController = (
          Engine.context as {
            AccountsController: AccountsController;
          }
        ).AccountsController;

        const selectedInternalAccountChecksummedAddress = toChecksumHexAddress(
          accountsController.getSelectedAccount().address,
        );

        const networkController = (
          Engine.context as {
            NetworkController: NetworkController;
          }
        ).NetworkController;

        const {
          configuration: { chainId },
        } = networkController.getNetworkClientById(
          networkController.state?.selectedNetworkClientId,
        );

        this.currentClientId = sessionId;

        // Handle custom rpc method
        const processedRpc = await handleCustomRpcCalls({
          batchRPCManager: this.batchRPCManager,
          selectedChainId: chainId,
          selectedAddress: selectedInternalAccountChecksummedAddress,
          rpc: { id: data.id, method: data.method, params: data.params },
        });

        DevLogger.log(
          `AndroidService::onMessageReceived processedRpc`,
          processedRpc,
        );
        this.rpcQueueManager.add({
          id: processedRpc?.id ?? data.id,
          method: processedRpc?.method ?? data.method,
        });
        bridge.onMessage({ name: 'metamask-provider', data: processedRpc });
      };
      handleEventAsync().catch((err) => {
        Logger.log(
          err,
          `AndroidService::onMessageReceived error handling event`,
        );
      });
    });
  }

  private restorePreviousConnections() {
    if (Object.keys(this.connections ?? {}).length) {
      Object.values(this.connections).forEach((clientInfo) => {
        if (isDappConnectionExpired(clientInfo.validUntil)) {
          this.forgetConnection(clientInfo.clientId);
          return;
        }
        try {
          this.setupBridge(clientInfo);
          this.sendMessage(
            {
              type: MessageType.READY,
              data: {
                id: clientInfo?.clientId,
              },
            },
            false,
          ).catch((err) => {
            Logger.log(
              err,
              `AndroidService:: error sending jsonrpc error to client ${clientInfo.clientId}`,
            );
          });
        } catch (error) {
          Logger.log(
            error,
            `AndroidService:: error setting up bridge for client ${clientInfo.clientId}`,
          );
        }
      });
    }
  }

  private setupBridge(clientInfo: DappClient) {
    DevLogger.log(
      `AndroidService::setupBridge for id=${clientInfo.clientId} exists=${!!this
        .bridgeByClientId[clientInfo.clientId]}}`,
    );

    if (this.bridgeByClientId[clientInfo.clientId]) {
      return;
    }

    const defaultBridgeParams = getDefaultBridgeParams(clientInfo);

    const bridge = new BackgroundBridge({
      webview: null,
      channelId: clientInfo.clientId,
      isMMSDK: true,
      url: PROTOCOLS.METAMASK + '://' + AppConstants.MM_SDK.SDK_REMOTE_ORIGIN,
      isRemoteConn: true,
      sendMessage: this.sendMessage.bind(this),
      ...defaultBridgeParams,
    });

    this.bridgeByClientId[clientInfo.clientId] = bridge;
  }

  /** Persists a connection; call only after the user approved it. */
  private async saveApprovedConnection(
    clientId: string,
    originatorInfo: OriginatorInfo,
  ) {
    const lastAuthorized = Date.now();
    const validUntil = lastAuthorized + DEFAULT_SESSION_TIMEOUT_MS;
    this.connections[clientId] = {
      connected: true,
      clientId,
      originatorInfo,
      validUntil,
    };
    await SDKConnect.getInstance().addDappConnection({
      id: clientId,
      lastAuthorized,
      origin: AppConstants.MM_SDK.ANDROID_SDK,
      originatorInfo,
      otherPublicKey: '',
      validUntil,
    });
  }

  /**
   * Drops a connection everywhere: disconnects its bridge, removes the
   * in-memory and persisted entries and revokes its permissions.
   */
  private forgetConnection(channelId: string) {
    try {
      this.bridgeByClientId[channelId]?.onDisconnect?.();
    } catch (err) {
      Logger.log(err, `AndroidService::forgetConnection bridge ${channelId}`);
    }
    delete this.bridgeByClientId[channelId];
    delete this.connections[channelId];
    try {
      SDKConnect.getInstance().removeDappConnection(channelId);

      const permissionsController = (
        Engine.context as {
          // TODO: Replace "any" with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          PermissionController: PermissionController<any, any>;
        }
      ).PermissionController;
      if (permissionsController?.getPermissions(channelId)) {
        permissionsController.revokeAllPermissions(channelId);
      }
    } catch (err) {
      Logger.log(err, `AndroidService::forgetConnection error ${channelId}`);
    }
  }

  async removeConnection(channelId: string) {
    try {
      if (this.connections[channelId]) {
        DevLogger.log(
          `AndroidService::remove client ${channelId} exists --- remove bridge`,
        );
        delete this.bridgeByClientId[channelId];
      }
      delete this.connections[channelId];
    } catch (err) {
      Logger.log(err, `AndroidService::remove error`);
    }
  }

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendMessage(message: any, forceRedirect?: boolean) {
    return sendMessage(this, message, forceRedirect);
  }
}
