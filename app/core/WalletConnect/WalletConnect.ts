import RNWalletConnect from '@walletconnect/client';
import type {
  IClientMeta,
  IJsonRpcRequest,
  IWalletConnectOptions,
  IWalletConnectSession,
} from '@walletconnect/client/node_modules/@walletconnect/types';
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
import { Linking, type ImageSourcePropType } from 'react-native';
import { Minimizer } from '../NativeModules';
import AppConstants from '../AppConstants';
import { strings } from '../../../locales/i18n';
import NotificationManager from '../NotificationManager';
import { msBetweenDates, msToHours } from '../../util/date';
import { addTransaction } from '../../util/transaction-controller';
import URLParse from 'url-parse';
import { parseWalletConnectUri } from './wc-utils';
import { store } from '../../store';
import { selectEvmChainId } from '../../selectors/networkController';
import ppomUtil from '../../../app/lib/ppom/ppom-util';
import type { MutableRefObject } from 'react';
import type { Json } from '@metamask/utils';

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

interface WalletConnectPeerMeta extends IClientMeta {
  dappScheme?: string;
}

interface StoredSession
  extends Omit<IWalletConnectSession, 'peerMeta'> {
  peerMeta: WalletConnectPeerMeta | null;
  autosign?: boolean;
  redirectUrl?: string;
  requestOriginatedFrom?: string;
  lastTimeConnected?: string | Date;
}

interface WalletConnectOptions {
  uri?: string;
  session: Partial<StoredSession>;
}

type SessionData = Partial<StoredSession> & {
  peerMeta?: WalletConnectPeerMeta | null;
};

const persistSessions = async () => {
  const sessions = connectors
    .filter((connector) => connector?.walletConnector?.connected)
    .map((connector): StoredSession | undefined => {
      const walletConnector = connector.walletConnector;
      if (!walletConnector) return undefined;
      return {
        ...walletConnector.session,
        autosign: connector.autosign,
        redirectUrl: connector.redirectUrl ?? undefined,
        requestOriginatedFrom: connector.requestOriginatedFrom ?? undefined,
        lastTimeConnected: new Date(),
      } as StoredSession;
    })
  .filter((session): session is StoredSession => session !== undefined);

  await StorageWrapper.setItem(
    WALLETCONNECT_SESSIONS,
    JSON.stringify(sessions),
  );
};

const waitForInitialization = async () => {
  let i = 0;
  while (!initialized) {
    await new Promise<void>((res) => setTimeout(() => res(), 1000));
    if (i++ > 5) initialized = true;
  }
};

const waitForKeychainUnlocked = async () => {
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
  url: MutableRefObject<string> = { current: '' };
  title: MutableRefObject<string> = { current: '' };
  icon: MutableRefObject<ImageSourcePropType | undefined> = {
    current: undefined,
  };
  dappScheme: { current: string | null } = { current: null };
  requestsToRedirect: Record<string, boolean> = {};
  hostname: string | null = null;
  requestOriginatedFrom: string | null = null;
  walletConnector: RNWalletConnect | null = null;

  constructor(options: WalletConnectOptions, existing = false) {
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
    } as IWalletConnectOptions);
    /**
   * Subscribe to session requests
     */
    this.walletConnector.on(
      'session_request',
      async (error: Error | null, payload: IJsonRpcRequest) => {
        Logger.log('WC session_request:', payload);
        if (error) {
          throw error;
        }

      await waitForKeychainUnlocked();

      try {
        const sessionData: SessionData = {
          ...(payload.params[0] as Partial<StoredSession>),
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
      async (error: Error | null, payload: IJsonRpcRequest) => {
      if (!this.walletConnector) return;
      if (tempCallIds.includes(payload.id)) return;
      tempCallIds.push(payload.id);

      await waitForKeychainUnlocked();

      Logger.log('CALL_REQUEST', error, payload);
      if (error) {
        throw error;
      }

      if (payload.method) {
        const payloadUrl = this.walletConnector.session.peerMeta?.url;
        if (!payloadUrl) return;
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
              const selectedAddress =
                Engine.context.AccountsController.getSelectedAccount().address?.toLowerCase();

              const txParams = payload.params[0] as TransactionParams;
              const chainId = txParams.chainId;
              const numericChainId = chainId
                ? parseInt(chainId, 16)
                : undefined;

              checkActiveAccountAndChainId({
                address: txParams.from,
                chainId: numericChainId,
                isWalletConnect: true,
                activeAccounts: selectedAddress ? [selectedAddress] : [],
                hostname: payloadHostname,
              } as unknown as Parameters<typeof checkActiveAccountAndChainId>[0]);

              const { NetworkController } = Engine.context;
              const networkClientId = chainId
                ? NetworkController.findNetworkClientIdByChainId(chainId)
                : undefined;

              const trx = await addTransaction(txParams, {
                deviceConfirmedOn: WalletDevice.MM_MOBILE,
                networkClientId: networkClientId as string,
                origin: WALLET_CONNECT_ORIGIN + this.url.current,
              });

              const id = trx.transactionMeta.id;
              const reqObject = {
                id: payload.id,
                jsonrpc: '2.0',
                method: payload.method,
                origin: this.url.current,
                params: [
                  {
                    from: txParams.from,
                    to: txParams.to,
                    value: txParams.value,
                    data: txParams.data,
                  },
                ],
              };

              ppomUtil.validateRequest(reqObject, id);

              const hash = await trx.result;
              this.approveRequest({
                id: payload.id,
                result: hash,
              });
            } catch (requestError) {
              this.rejectRequest({
                id: payload.id,
                error:
                  requestError instanceof Error
                    ? { message: requestError.message }
                    : { message: String(requestError) },
              });
            }
            return;
          }

          this.backgroundBridge?.onMessage({
            name: 'walletconnect-provider',
            data: payload,
            origin: this.hostname ?? undefined,
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
      (error: Error | null, payload: IJsonRpcRequest) => {
      Logger.log('WC: Session update', payload);
      if (error) {
        throw error;
      }
      },
    );

    if (existing) {
      this.startSession(options.session as SessionData, existing);
    }
  }

  redirect = () => {
    if (this.requestOriginatedFrom === AppConstants.DEEPLINKS.ORIGIN_QR_CODE)
      return;

    setTimeout(() => {
      if (this.dappScheme.current || this.redirectUrl) {
        Linking.openURL(
          this.dappScheme.current
            ? `${this.dappScheme.current}://`
            : this.redirectUrl ?? '',
        );
      } else {
        Minimizer.goBack();
      }
    }, 300);
  };

  needsRedirect = (id: number | string): void => {
    if (this.requestsToRedirect[id]) {
      delete this.requestsToRedirect[id];
      this.redirect();
    }
  };

  approveRequest = ({
    id,
    result,
  }: {
    id: number | string;
    result: unknown;
  }): void => {
    this.walletConnector?.approveRequest({
      id,
      result,
    } as unknown as Parameters<
      NonNullable<typeof this.walletConnector>['approveRequest']
    >[0]);
    this.needsRedirect(id);
  };

  rejectRequest = ({
    id,
    error,
  }: {
    id: number | string;
    error: unknown;
  }): void => {
    this.walletConnector?.rejectRequest({
      id,
      error,
    } as unknown as Parameters<
      NonNullable<typeof this.walletConnector>['rejectRequest']
    >[0]);
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

  startSession = async (sessionData: SessionData, existing = false): Promise<void> => {
    const chainId = selectEvmChainId(store.getState());
    const selectedAddress =
      Engine.context.AccountsController.getSelectedAccount().address?.toLowerCase();
    if (!selectedAddress) {
      return;
    }
    if (!sessionData.peerMeta) {
      return;
    }
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
    this.title.current = sessionData.peerMeta?.name;
    this.icon.current = sessionData.peerMeta.icons?.[0] as unknown as ImageSourcePropType;
    this.dappScheme.current = sessionData.peerMeta.dappScheme ?? null;

    this.hostname = new URLParse(this.url.current).hostname;

    this.backgroundBridge = new BackgroundBridge({
      webview: null,
      url: this.url.current,
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
          navigation: null, //props.navigation,
          // Website info
          url: this.url,
          title: this.title,
          icon: this.icon,
          // Bookmarks
          isHomepage: () => false,
          // Show autocomplete
          fromHomepage: { current: false },
          toggleUrlModal: () => null,
          // Wizard
          wizardScrollAdjusted: { current: false },
          tabId: false,
          isWalletConnect: true,
          isMMSDK: false,
          injectHomePageScripts: () => false,
          analytics: {},
        }),
      isMainFrame: true,
    });
  };

  killSession = () => {
    this.backgroundBridge?.onDisconnect();
    this.walletConnector?.killSession();
    this.walletConnector = null;
  };

  sessionRequest = async (peerInfo: SessionData): Promise<unknown> => {
    const { ApprovalController } = Engine.context;
    try {
      if (!peerInfo.peerMeta) {
        throw new Error('WalletConnect session metadata missing');
      }
      const { host } = new URLParse(peerInfo.peerMeta.url);
      return await ApprovalController.add({
        id: random(),
        origin: host,
        requestData: peerInfo as unknown as Record<string, Json>,
        type: ApprovalTypes.WALLET_CONNECT,
      });
    } catch (error) {
      throw new Error('WalletConnect session request rejected');
    }
  };
}

const instance = {
  async init() {
    const sessionData = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
    if (sessionData) {
      const sessions = JSON.parse(sessionData);

      sessions.forEach((session: StoredSession) => {
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
  connectors() {
    return connectors;
  },
  async newSession(
    uri: string,
    redirectUrl?: string,
    autosign?: boolean,
    requestOriginatedFrom?: string,
  ) {
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

    const sessions = connectors.reduce<StoredSession[]>((result, connector) => {
      if (connector.walletConnector?.connected) {
        result.push({ ...connector.walletConnector.session } as StoredSession);
      }
      return result;
    }, []);
    if (sessions.length >= AppConstants.WALLET_CONNECT.LIMIT_SESSIONS) {
      await this.killSession(sessions[0].peerId);
    }

    const data: WalletConnectOptions = { uri, session: {} };
    if (redirectUrl) {
      data.session.redirectUrl = redirectUrl;
    }
    if (autosign) {
      data.session.autosign = autosign;
    }
    if (requestOriginatedFrom) {
      data.session.requestOriginatedFrom = requestOriginatedFrom;
    }
    connectors.push(new WalletConnect(data));
  },
  getSessions: async () => {
    let sessions: StoredSession[] = [];
    const sessionData = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
    if (sessionData) {
        sessions = JSON.parse(sessionData) as StoredSession[];
    }
    return sessions;
  },
  killSession: async (id: string) => {
    // 1) First kill the session
    const connectorToKill = connectors.find(
      (connector) =>
        connector?.walletConnector?.session.peerId === id,
    );
    if (connectorToKill) {
      await connectorToKill.killSession();
    }
    // 2) Remove from the list of connectors
    connectors = connectors.filter(
      (connector) =>
        connector?.walletConnector?.connected &&
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
