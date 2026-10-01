import RNWalletConnect from '@walletconnect/client';
import { v1 as random } from 'uuid';
import Engine from '../Engine';
import Logger from '../../util/Logger';
// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';
import StorageWrapper from '../../store/storage-wrapper';
import {
  CLIENT_OPTIONS,
  WALLET_CONNECT_ORIGIN,
} from '../../util/walletconnect';
import { WALLETCONNECT_SESSIONS } from '../../constants/storage';
import {
  WalletDevice,
  type TransactionParams,
} from '@metamask/transaction-controller';
import BackgroundBridge from '../BackgroundBridge/BackgroundBridge';
import getRpcMethodMiddleware, {
  checkActiveAccountAndChainId,
  ApprovalTypes,
} from '../RPCMethods/RPCMethodMiddleware';
import { Linking } from 'react-native';
import { Minimizer } from '../NativeModules';
import AppConstants from '../AppConstants';
import { strings } from '../../../locales/i18n';
import NotificationManager from '../NotificationManager';
import { msBetweenDates, msToHours } from '../../util/date';
import { addTransaction } from '../../util/transaction-controller';
import type { Hex } from '@metamask/utils';
import URLParse from 'url-parse';
import { parseWalletConnectUri } from './wc-utils';
import { store } from '../../store';
import { selectEvmChainId } from '../../selectors/networkController';
import ppomUtil from '../../../app/lib/ppom/ppom-util';
// Local re-declarations of the legacy WalletConnect v1 client types. The
// upstream `@walletconnect/types` package distributed by the legacy
// `@walletconnect/client` is nested under that package and not directly
// importable from app code.
interface IClientMeta {
  description: string;
  url: string;
  icons: string[];
  name: string;
}

interface IWalletConnectSession {
  connected: boolean;
  accounts: string[];
  chainId: number;
  bridge: string;
  key: string;
  clientId: string;
  clientMeta: IClientMeta | null;
  peerId: string;
  peerMeta: IClientMeta | null;
  handshakeId: number;
  handshakeTopic: string;
}

interface IWalletConnectOptions {
  bridge?: string;
  uri?: string;
  storageId?: string;
  signingMethods?: string[];
  session?: IWalletConnectSession;
}

type WalletConnectPersistedSession = IWalletConnectSession & {
  autosign?: boolean;
  redirectUrl?: string;
  requestOriginatedFrom?: string;
  lastTimeConnected?: Date | string;
};

interface WalletConnectSessionDataWithPeerMeta extends IWalletConnectSession {
  autosign?: boolean;
  redirectUrl?: string;
  requestOriginatedFrom?: string;
  peerMeta: IClientMeta & {
    dappScheme?: string;
  };
}

interface WalletConnectOptionsInput extends IWalletConnectOptions {
  session: WalletConnectPersistedSession;
}

interface WalletConnectJsonRpcCallPayload {
  id: number;
  jsonrpc?: string;
  method: string;
  params: Record<string, unknown>[];
}

const hub = new EventEmitter();
let connectors: WalletConnect[] = [];
let initialized = false;
const tempCallIds: number[] = [];

const METHODS_TO_REDIRECT: Record<string, boolean> = {
  eth_requestAccounts: true,
  eth_sendTransaction: true,
  eth_signTransaction: true,
  personal_sign: true,
  eth_signTypedData: true,
  eth_signTypedData_v3: true,
  eth_signTypedData_v4: true,
  wallet_watchAsset: true,
  wallet_addEthereumChain: true,
  wallet_switchEthereumChain: true,
};

const persistSessions = async (): Promise<void> => {
  const sessions = connectors
    .filter((connector) => connector?.walletConnector?.connected)
    .map((connector) => ({
      ...(connector.walletConnector?.session as IWalletConnectSession),
      autosign: connector.autosign,
      redirectUrl: connector.redirectUrl,
      requestOriginatedFrom: connector.requestOriginatedFrom,
      lastTimeConnected: new Date(),
    }));

  await StorageWrapper.setItem(
    WALLETCONNECT_SESSIONS,
    JSON.stringify(sessions),
  );
};

const waitForInitialization = async (): Promise<void> => {
  let i = 0;
  while (!initialized) {
    await new Promise<void>((res) => setTimeout(() => res(), 1000));
    if (i++ > 5) initialized = true;
  }
};

const waitForKeychainUnlocked = async (): Promise<void> => {
  let i = 0;
  const { KeyringController } = Engine.context;
  while (!KeyringController.isUnlocked()) {
    await new Promise<void>((res) => setTimeout(() => res(), 1000));
    if (i++ > 60) break;
  }
};

class WalletConnect {
  redirectUrl: string | null = null;
  autosign = false;
  backgroundBridge: BackgroundBridge | null = null;
  url: { current: string | null } = { current: null };
  title: { current: string | null } = { current: null };
  icon: { current: string | null } = { current: null };
  dappScheme: { current: string | null } = { current: null };
  requestsToRedirect: Record<string, boolean> = {};
  hostname: string | null = null;
  requestOriginatedFrom: string | null = null;
  walletConnector: RNWalletConnect | null;

  constructor(options: WalletConnectOptionsInput, existing?: boolean) {
    if (options.session.redirectUrl) {
      this.redirectUrl = options.session.redirectUrl;
    }

    if (options.session.autosign) {
      this.autosign = options.session.autosign;
    }

    if (options.session.requestOriginatedFrom) {
      this.requestOriginatedFrom = options.session.requestOriginatedFrom;
    }

    this.walletConnector = new RNWalletConnect({
      ...options,
      ...CLIENT_OPTIONS,
    });
    /**
     * Subscribe to session requests
     */
    this.walletConnector.on(
      'session_request',
      async (
        error: Error | null,
        payload: { params: WalletConnectSessionDataWithPeerMeta[] },
      ) => {
        Logger.log('WC session_request:', payload);
        if (error) {
          throw error;
        }

        await waitForKeychainUnlocked();

        try {
          const sessionData: WalletConnectSessionDataWithPeerMeta = {
            ...payload.params[0],
            autosign: this.autosign,
            redirectUrl: this.redirectUrl ?? undefined,
            requestOriginatedFrom: this.requestOriginatedFrom ?? undefined,
          };

          Logger.log('WC:', sessionData);

          await waitForInitialization();
          await this.sessionRequest(sessionData);

          await this.startSession(sessionData, existing);

          this.redirect();
        } catch (e) {
          this.walletConnector?.rejectSession();
          this.redirect();
        }
      },
    );

    /**
     * Subscribe to call requests
     */
    this.walletConnector.on(
      'call_request',
      async (
        error: Error | null,
        payload: WalletConnectJsonRpcCallPayload,
      ) => {
        if (tempCallIds.includes(payload.id)) return;
        tempCallIds.push(payload.id);

        await waitForKeychainUnlocked();

        Logger.log('CALL_REQUEST', error, payload);
        if (error) {
          throw error;
        }

        if (payload.method) {
          const peerMeta = this.walletConnector?.session.peerMeta as
            | IClientMeta
            | null
            | undefined;
          const payloadUrl = peerMeta?.url ?? '';
          const payloadHostname = new URLParse(payloadUrl).hostname;
          if (payloadHostname === this.backgroundBridge?.hostname) {
            if (METHODS_TO_REDIRECT[payload.method]) {
              this.requestsToRedirect[payload.id] = true;
            }

            if (payload.method === 'eth_signTypedData') {
              payload.method = 'eth_signTypedData_v3';
            }

            // We have to implement this method here since the eth_sendTransaction in Engine is not working because we can't send correct origin
            if (payload.method === 'eth_sendTransaction') {
              try {
                const firstParam = payload.params[0] as {
                  chainId: string;
                  from: string;
                  to?: string;
                  value?: string;
                  data?: string;
                };
                const selectedAddress =
                  Engine.context.AccountsController.getSelectedAccount().address?.toLowerCase();

                const chainId = firstParam.chainId;

                checkActiveAccountAndChainId({
                  address: firstParam.from,
                  chainId: chainId as unknown as number,
                  isWalletConnect: true,
                  activeAccounts: [selectedAddress],
                  hostname: payloadHostname,
                } as Parameters<typeof checkActiveAccountAndChainId>[0]);

                const { NetworkController } = Engine.context;
                const networkClientId =
                  NetworkController.findNetworkClientIdByChainId(
                    chainId as Hex,
                  );

                const trx = await addTransaction(firstParam as TransactionParams, {
                  deviceConfirmedOn: WalletDevice.MM_MOBILE,
                  networkClientId,
                  origin: this.url.current
                    ? WALLET_CONNECT_ORIGIN + this.url.current
                    : undefined,
                });

                const id = trx.transactionMeta.id;
                const reqObject = {
                  id: payload.id,
                  jsonrpc: '2.0',
                  method: payload.method,
                  origin: this.url.current,
                  params: [
                    {
                      from: firstParam.from,
                      to: firstParam.to,
                      value: firstParam.value,
                      data: firstParam.data,
                    },
                  ],
                };

                ppomUtil.validateRequest(
                  reqObject as Parameters<typeof ppomUtil.validateRequest>[0],
                  id,
                );

                const hash = await trx.result;
                this.approveRequest({
                  id: payload.id,
                  result: hash,
                });
              } catch (e) {
                this.rejectRequest({
                  id: payload.id,
                  error: e as Error,
                });
              }
              return;
            }

            this.backgroundBridge.onMessage({
              name: 'walletconnect-provider',
              data: payload,
              origin: this.hostname,
            });
          }
        }

        // Clean call ids
        tempCallIds.length = 0;
      },
    );

    /**
     *	Subscribe to disconnect
     */
    this.walletConnector.on('disconnect', (error: Error | null) => {
      if (error) {
        throw error;
      }
      this.killSession();
      persistSessions();
    });

    this.walletConnector.on(
      'session_update',
      (error: Error | null, payload: unknown) => {
        Logger.log('WC: Session update', payload);
        if (error) {
          throw error;
        }
      },
    );

    if (existing) {
      this.startSession(
        options.session as unknown as WalletConnectSessionDataWithPeerMeta,
        existing,
      );
    }
  }

  redirect = (): void => {
    if (this.requestOriginatedFrom === AppConstants.DEEPLINKS.ORIGIN_QR_CODE)
      return;

    setTimeout(() => {
      if (this.dappScheme.current || this.redirectUrl) {
        Linking.openURL(
          this.dappScheme.current
            ? `${this.dappScheme.current}://`
            : (this.redirectUrl as string),
        );
      } else {
        Minimizer.goBack();
      }
    }, 300);
  };

  needsRedirect = (id: number): void => {
    if (this.requestsToRedirect[id]) {
      delete this.requestsToRedirect[id];
      this.redirect();
    }
  };

  approveRequest = ({ id, result }: { id: number; result: unknown }): void => {
    this.walletConnector?.approveRequest({
      id,
      result,
    });
    this.needsRedirect(id);
  };

  rejectRequest = ({ id, error }: { id: number; error: unknown }): void => {
    this.walletConnector?.rejectRequest({
      id,
      error: error as { code: number; message: string },
    });
    this.needsRedirect(id);
  };

  updateSession = ({
    chainId,
    accounts,
  }: {
    chainId: number;
    accounts: string[];
  }): void => {
    this.walletConnector?.updateSession({
      chainId,
      accounts,
    });
  };

  startSession = async (
    sessionData: WalletConnectSessionDataWithPeerMeta,
    existing?: boolean,
  ): Promise<void> => {
    const chainId = selectEvmChainId(store.getState());
    const selectedAddress =
      Engine.context.AccountsController.getSelectedAccount().address?.toLowerCase();
    const approveData = {
      chainId: parseInt(chainId, 10),
      accounts: [selectedAddress],
    };
    if (existing) {
      this.walletConnector?.updateSession(approveData);
    } else {
      await this.walletConnector?.approveSession(approveData);
      persistSessions();
    }

    this.url.current = sessionData.peerMeta.url;
    this.title.current = sessionData.peerMeta?.name ?? null;
    this.icon.current = sessionData.peerMeta?.icons?.[0] ?? null;
    this.dappScheme.current = sessionData.peerMeta?.dappScheme ?? null;

    this.hostname = new URLParse(this.url.current as string).hostname;

    this.backgroundBridge = new BackgroundBridge({
      webview: null,
      url: this.url.current as string,
      isWalletConnect: true,
      wcRequestActions: {
        approveRequest: this.approveRequest,
        rejectRequest: this.rejectRequest,
        updateSession: this.updateSession,
      },
      getRpcMethodMiddleware: ({ getProviderState }) =>
        getRpcMethodMiddleware({
          hostname: WALLET_CONNECT_ORIGIN + this.hostname,
          getProviderState,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          navigation: null as any, //props.navigation,
          // Website info
          url: this.url as { current: string },
          title: this.title as { current: string },
          icon: this.icon as { current: import('react-native').ImageSourcePropType | undefined },
          // Bookmarks
          isHomepage: (() => false) as unknown as () => boolean,
          // Show autocomplete
          fromHomepage: { current: false },
          toggleUrlModal: () => null,
          // Wizard
          wizardScrollAdjusted: { current: false },
          tabId: false,
          isWalletConnect: true,
          analytics: {},
          isMMSDK: false,
          injectHomePageScripts: () => undefined,
        }),
      isMainFrame: true,
    });
  };

  killSession = (): void => {
    this.backgroundBridge?.onDisconnect();
    this.walletConnector?.killSession();
    this.walletConnector = null;
  };

  sessionRequest = async (
    peerInfo: WalletConnectSessionDataWithPeerMeta,
  ): Promise<unknown> => {
    const { ApprovalController } = Engine.context;
    try {
      const { host } = new URLParse(peerInfo.peerMeta.url);
      return await ApprovalController.add({
        id: random(),
        origin: host,
        requestData: peerInfo as unknown as Record<string, unknown>,
        type: ApprovalTypes.WALLET_CONNECT,
      } as Parameters<typeof ApprovalController.add>[0]);
    } catch (error) {
      throw new Error('WalletConnect session request rejected');
    }
  };
}

interface WalletConnectModule {
  init(): Promise<void>;
  connectors(): WalletConnect[];
  newSession(
    uri: string,
    redirectUrl: string | undefined,
    autosign: boolean | undefined,
    requestOriginatedFrom: string | undefined,
  ): Promise<void>;
  getSessions(): Promise<WalletConnectPersistedSession[]>;
  killSession(id: string): Promise<void>;
  hub: EventEmitter;
  isValidUri(uri: string): boolean;
  getValidUriFromDeeplink(uri: string): string;
  isSessionConnected(uri: string): boolean;
}

const instance: WalletConnectModule = {
  async init(): Promise<void> {
    const sessionData = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
    if (sessionData) {
      const sessions: WalletConnectPersistedSession[] = JSON.parse(sessionData);

      sessions.forEach((session) => {
        if (session.lastTimeConnected) {
          const sessionDate = new Date(session.lastTimeConnected);
          const diffBetweenDatesInMs = msBetweenDates(sessionDate);
          const diffInHours = msToHours(diffBetweenDatesInMs);

          if (diffInHours <= AppConstants.WALLET_CONNECT.SESSION_LIFETIME) {
            connectors.push(new WalletConnect({ session }, true));
          } else {
            const connector = new WalletConnect({ session }, true);
            connector.killSession();
          }
        } else {
          connectors.push(new WalletConnect({ session }, true));
        }
      });
    }
    initialized = true;
  },
  connectors(): WalletConnect[] {
    return connectors;
  },
  async newSession(
    uri: string,
    redirectUrl: string | undefined,
    autosign: boolean | undefined,
    requestOriginatedFrom: string | undefined,
  ): Promise<void> {
    const alreadyConnected = this.isSessionConnected(uri);
    if (alreadyConnected) {
      NotificationManager.showSimpleNotification({
        duration: 5000,
        title: strings('walletconnect_sessions.session_already_exist'),
        description: strings('walletconnect_sessions.close_current_session'),
        status: 'error',
      });
      return;
    }

    const sessions = connectors
      .filter((connector) => connector?.walletConnector?.connected)
      .map((connector) => ({
        ...(connector.walletConnector?.session as IWalletConnectSession),
      }));
    if (sessions.length >= AppConstants.WALLET_CONNECT.LIMIT_SESSIONS) {
      await this.killSession(sessions[0].peerId);
    }

    const data: { uri: string; session: Partial<WalletConnectPersistedSession> } = {
      uri,
      session: {},
    };
    if (redirectUrl) {
      data.session.redirectUrl = redirectUrl;
    }
    if (autosign) {
      data.session.autosign = autosign;
    }
    if (requestOriginatedFrom) {
      data.session.requestOriginatedFrom = requestOriginatedFrom;
    }
    connectors.push(
      new WalletConnect(data as unknown as WalletConnectOptionsInput),
    );
  },
  getSessions: async (): Promise<WalletConnectPersistedSession[]> => {
    let sessions: WalletConnectPersistedSession[] = [];
    const sessionData = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
    if (sessionData) {
      sessions = JSON.parse(sessionData);
    }
    return sessions;
  },
  killSession: async (id: string): Promise<void> => {
    // 1) First kill the session
    const connectorToKill = connectors.find(
      (connector) =>
        connector?.walletConnector &&
        connector.walletConnector.session.peerId === id,
    );
    if (connectorToKill) {
      await connectorToKill.killSession();
    }
    // 2) Remove from the list of connectors
    connectors = connectors.filter(
      (connector) =>
        connector?.walletConnector &&
        connector.walletConnector.connected &&
        connector.walletConnector.session.peerId !== id,
    );
    // 3) Persist the list
    await persistSessions();
  },
  hub,
  isValidUri(uri: string): boolean {
    const result = parseWalletConnectUri(uri);
    if (!result.handshakeTopic || !result.bridge || !result.key) {
      return false;
    }
    return true;
  },
  getValidUriFromDeeplink(uri: string): string {
    const prefix = 'wc://wc?uri=';
    return uri.replace(prefix, '');
  },
  isSessionConnected(uri: string): boolean {
    const wcUri = parseWalletConnectUri(uri);
    return connectors.some(({ walletConnector }) => {
      if (!walletConnector) {
        return false;
      }
      const { handshakeTopic, key } = walletConnector.session;
      return handshakeTopic === wcUri.handshakeTopic && key === wcUri.key;
    });
  },
};

export default instance;
