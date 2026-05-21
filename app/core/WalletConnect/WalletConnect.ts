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
import { WalletDevice } from '@metamask/transaction-controller';
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
import URL from 'url-parse';
import { parseWalletConnectUri } from './wc-utils';
import { store } from '../../store';
import { selectEvmChainId } from '../../selectors/networkController';
import ppomUtil from '../../../app/lib/ppom/ppom-util';
import type { Hex } from '@metamask/utils';
import type { IWalletConnectSession } from '@walletconnect/client/node_modules/@walletconnect/types';

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

interface WalletConnectSessionExtended extends IWalletConnectSession {
  redirectUrl?: string;
  autosign?: boolean;
  requestOriginatedFrom?: string;
  dappScheme?: string;
  lastTimeConnected?: Date | string;
}

interface WalletConnectOptions {
  uri?: string;
  session?: IWalletConnectSession;
}

interface WcPayload {
  id: number;
  method: string;
  params: Record<string, unknown>[];
}

const persistSessions = async () => {
  const sessions = connectors
    .filter(
      (connector: WalletConnect) => connector?.walletConnector?.connected,
    )
    .map((connector: WalletConnect) => ({
      ...connector.walletConnector.session,
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
  url: { current: string | null } = { current: null };
  title: { current: string | null } = { current: null };
  icon: { current: string | null } = { current: null };
  dappScheme: { current: string | null } = { current: null };
  requestsToRedirect: Record<number, boolean> = {};
  hostname: string | null = null;
  requestOriginatedFrom: string | null = null;
  walletConnector: RNWalletConnect;

  constructor(options: WalletConnectOptions, existing?: boolean) {
    const session = (options.session ?? {}) as WalletConnectSessionExtended;

    if (session.redirectUrl) {
      this.redirectUrl = session.redirectUrl;
    }

    if (session.autosign) {
      this.autosign = session.autosign;
    }

    if (session.requestOriginatedFrom) {
      this.requestOriginatedFrom = session.requestOriginatedFrom;
    }

    this.walletConnector = new RNWalletConnect({
      ...options,
      ...CLIENT_OPTIONS,
    });
    /**
     *  Subscribe to session requests
     */
    this.walletConnector.on(
      'session_request',
      async (error: Error | null, payload: { params: WalletConnectSessionExtended[] }) => {
        Logger.log('WC session_request:', payload);
        if (error) {
          throw error;
        }

        await waitForKeychainUnlocked();

        try {
          const sessionData: WalletConnectSessionExtended = {
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
          this.walletConnector.rejectSession();
          this.redirect();
        }
      },
    );

    /**
     *  Subscribe to call requests
     */
    this.walletConnector.on(
      'call_request',
      async (error: Error | null, payload: WcPayload) => {
        if (tempCallIds.includes(payload.id)) return;
        tempCallIds.push(payload.id);

        await waitForKeychainUnlocked();

        Logger.log('CALL_REQUEST', error, payload);
        if (error) {
          throw error;
        }

        if (payload.method) {
          const payloadUrl = this.walletConnector.session.peerMeta!.url;
          const payloadHostname = new URL(payloadUrl).hostname;
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

                const chainId = payload.params[0].chainId as string;

                checkActiveAccountAndChainId({
                  address: payload.params[0].from as string,
                  chainId: parseInt(chainId, 16),
                  isWalletConnect: true,
                  hostname: payloadHostname,
                });

                const { NetworkController } = Engine.context;
                const networkClientId =
                  NetworkController.findNetworkClientIdByChainId(chainId as Hex);

                const trx = await addTransaction(payload.params[0] as Parameters<typeof addTransaction>[0], {
                  deviceConfirmedOn: WalletDevice.MM_MOBILE,
                  networkClientId,
                  origin: this.url.current
                    ? WALLET_CONNECT_ORIGIN + this.url.current
                    : undefined,
                });

                const id = trx.transactionMeta.id;
                const reqObject = {
                  id: payload.id,
                  jsonrpc: '2.0' as const,
                  method: payload.method,
                  origin: this.url.current ?? '',
                  params: [
                    {
                      from: payload.params[0].from,
                      to: payload.params[0].to,
                      value: payload.params[0]?.value,
                      data: payload.params[0]?.data,
                    },
                  ],
                };

                ppomUtil.validateRequest(reqObject, id);

                const hash = await trx.result;
                this.approveRequest({
                  id: payload.id,
                  result: hash,
                });
              } catch (error) {
                this.rejectRequest({
                  id: payload.id,
                  error,
                });
              }
              return;
            }

            this.backgroundBridge.onMessage({
              name: 'walletconnect-provider',
              data: payload,
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
      this.startSession(session, existing);
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
            : this.redirectUrl!,
        );
      } else {
        Minimizer.goBack();
      }
    }, 300);
  };

  needsRedirect = (id: number) => {
    if (this.requestsToRedirect[id]) {
      delete this.requestsToRedirect[id];
      this.redirect();
    }
  };

  approveRequest = ({ id, result }: { id: number; result: string }) => {
    this.walletConnector.approveRequest({
      id,
      result,
    });
    this.needsRedirect(id);
  };

  rejectRequest = ({ id, error }: { id: number; error: unknown }) => {
    this.walletConnector.rejectRequest({
      id,
      error: error as { message: string },
    });
    this.needsRedirect(id);
  };

  updateSession = ({
    chainId,
    accounts,
  }: {
    chainId: number;
    accounts: string[];
  }) => {
    this.walletConnector.updateSession({
      chainId,
      accounts,
    });
  };

  startSession = async (
    sessionData: WalletConnectSessionExtended,
    existing?: boolean,
  ) => {
    const chainId = selectEvmChainId(store.getState());
    const selectedAddress =
      Engine.context.AccountsController.getSelectedAccount().address?.toLowerCase();
    const approveData = {
      chainId: parseInt(chainId, 10),
      accounts: [selectedAddress],
    };
    if (existing) {
      this.walletConnector.updateSession(approveData);
    } else {
      await this.walletConnector.approveSession(approveData);
      persistSessions();
    }

    this.url.current = sessionData.peerMeta!.url;
    this.title.current = sessionData.peerMeta?.name ?? null;
    this.icon.current = sessionData.peerMeta?.icons?.[0] ?? null;
    this.dappScheme.current = sessionData.dappScheme ?? null;

    this.hostname = new URL(this.url.current).hostname;

    this.backgroundBridge = new BackgroundBridge({
      webview: null,
      url: this.url.current,
      isWalletConnect: true,
      wcRequestActions: {
        approveRequest: this.approveRequest,
        rejectRequest: this.rejectRequest,
        updateSession: this.updateSession,
      },
      getRpcMethodMiddleware: ({
        hostname: _hostname,
        getProviderState,
      }) =>
        getRpcMethodMiddleware({
          hostname: WALLET_CONNECT_ORIGIN + this.hostname,
          getProviderState,
          navigation: null,
          url: this.url as { current: string },
          title: this.title as { current: string },
          icon: this.icon as unknown as { current: undefined },
          isHomepage: () => false,
          fromHomepage: { current: false },
          toggleUrlModal: () => null,
          wizardScrollAdjusted: { current: false },
          tabId: false,
          isWalletConnect: true,
        } as unknown as Parameters<typeof getRpcMethodMiddleware>[0]),
      isMainFrame: true,
      isRemoteConn: false,
    });
  };

  killSession = () => {
    this.backgroundBridge?.onDisconnect();
    this.walletConnector && this.walletConnector.killSession();
    this.walletConnector = null as unknown as RNWalletConnect;
  };

  sessionRequest = async (peerInfo: WalletConnectSessionExtended) => {
    const { ApprovalController } = Engine.context;
    try {
      const { host } = new URL(peerInfo.peerMeta!.url);
      return await ApprovalController.add({
        id: random(),
        origin: host,
        requestData: peerInfo as unknown as Record<string, import('@metamask/utils').Json>,
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
      const sessions: WalletConnectSessionExtended[] = JSON.parse(sessionData);

      sessions.forEach((session) => {
        if (session.lastTimeConnected) {
          const sessionDate = new Date(session.lastTimeConnected as string);
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

    const sessions = connectors
      .filter(
        (connector: WalletConnect) => connector?.walletConnector?.connected,
      )
      .map((connector: WalletConnect) => ({
        ...connector.walletConnector.session,
      }));
    if (sessions.length >= AppConstants.WALLET_CONNECT.LIMIT_SESSIONS) {
      await this.killSession(sessions[0].peerId!);
    }

    const data: WalletConnectOptions = { uri };
    const sessionExtended: Partial<WalletConnectSessionExtended> = {};
    if (redirectUrl) {
      sessionExtended.redirectUrl = redirectUrl;
    }
    if (autosign) {
      sessionExtended.autosign = autosign;
    }
    if (requestOriginatedFrom) {
      sessionExtended.requestOriginatedFrom = requestOriginatedFrom;
    }
    data.session = sessionExtended as IWalletConnectSession;
    connectors.push(new WalletConnect(data));
  },
  getSessions: async (): Promise<WalletConnectSessionExtended[]> => {
    let sessions: WalletConnectSessionExtended[] = [];
    const sessionData = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
    if (sessionData) {
      sessions = JSON.parse(sessionData);
    }
    return sessions;
  },
  killSession: async (id: string) => {
    // 1) First kill the session
    const connectorToKill = connectors.find(
      (connector) =>
        connector &&
        connector.walletConnector &&
        connector.walletConnector.session.peerId === id,
    );
    if (connectorToKill) {
      await connectorToKill.killSession();
    }
    // 2) Remove from the list of connectors
    connectors = connectors.filter(
      (connector) =>
        connector &&
        connector.walletConnector &&
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
