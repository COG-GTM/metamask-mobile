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
import type { Hex, Json } from '@metamask/utils';
import type { MutableRefObject } from 'react';
import { Linking, type ImageSourcePropType } from 'react-native';
import BackgroundBridge from '../BackgroundBridge/BackgroundBridge';
import getRpcMethodMiddleware, {
  checkActiveAccountAndChainId,
  ApprovalTypes,
} from '../RPCMethods/RPCMethodMiddleware';
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

type WCConnector = InstanceType<typeof RNWalletConnect>;
type WCSession = WCConnector['session'];
type WCSessionStatus = Parameters<WCConnector['updateSession']>[0];

export interface WCPeerMeta {
  description?: string;
  url: string;
  icons?: string[];
  name?: string;
  dappScheme?: string;
}

export interface WCSessionData extends Partial<Omit<WCSession, 'peerMeta'>> {
  peerMeta?: WCPeerMeta | null;
  autosign?: boolean;
  redirectUrl?: string;
  requestOriginatedFrom?: string;
  lastTimeConnected?: string | Date;
}

interface WCConnectorOptions {
  uri?: string;
  session: WCSessionData;
}

interface WCSessionRequestPayload {
  params: WCSessionData[];
}

interface WCCallRequestPayload {
  id: number;
  jsonrpc: string;
  method: string;
  params: unknown[];
}

interface WCApproveRequestArgs {
  id: number;
  result: unknown;
}

interface WCRejectRequestArgs {
  id: number;
  error: unknown;
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

const persistSessions = async () => {
  const sessions = connectors
    .filter((connector) => connector?.walletConnector?.connected)
    .map((connector) => ({
      ...connector.walletConnector?.session,
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
  url: MutableRefObject<string> = { current: '' };
  title: MutableRefObject<string> = { current: '' };
  icon: MutableRefObject<ImageSourcePropType | undefined> = {
    current: undefined,
  };
  dappScheme: MutableRefObject<string | undefined> = { current: undefined };
  requestsToRedirect: Record<number, boolean> = {};
  hostname: string | null = null;
  requestOriginatedFrom: string | null = null;
  walletConnector: WCConnector | null;

  constructor(options: WCConnectorOptions, existing?: boolean) {
    if (options.session.redirectUrl) {
      this.redirectUrl = options.session.redirectUrl;
    }

    if (options.session.autosign) {
      this.autosign = options.session.autosign;
    }

    if (options.session.requestOriginatedFrom) {
      this.requestOriginatedFrom = options.session.requestOriginatedFrom;
    }

    const walletConnector = new RNWalletConnect({
      ...options,
      session: options.session as WCSession,
      ...CLIENT_OPTIONS,
    });
    this.walletConnector = walletConnector;
    /**
     * Subscribe to session requests
     */
    walletConnector.on(
      'session_request',
      async (error: Error | null, payload: WCSessionRequestPayload) => {
        Logger.log('WC session_request:', payload);
        if (error) {
          throw error;
        }

        await waitForKeychainUnlocked();

        try {
          const sessionData: WCSessionData = {
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
          walletConnector.rejectSession();
          this.redirect();
        }
      },
    );

    /**
     * Subscribe to call requests
     */
    walletConnector.on(
      'call_request',
      async (error: Error | null, payload: WCCallRequestPayload) => {
        if (tempCallIds.includes(payload.id)) return;
        tempCallIds.push(payload.id);

        await waitForKeychainUnlocked();

        Logger.log('CALL_REQUEST', error, payload);
        if (error) {
          throw error;
        }

        if (payload.method) {
          const payloadUrl = walletConnector.session.peerMeta?.url ?? '';
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
                const txParams = payload.params[0] as TransactionParams;
                const chainId = txParams.chainId as Hex;

                checkActiveAccountAndChainId({
                  address: txParams.from,
                  chainId: chainId ? Number(chainId) : undefined,
                  isWalletConnect: true,
                  hostname: payloadHostname,
                });

                const { NetworkController } = Engine.context;
                const networkClientId =
                  NetworkController.findNetworkClientIdByChainId(chainId);

                const trx = await addTransaction(txParams, {
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
                      from: txParams.from,
                      to: txParams.to,
                      value: txParams?.value,
                      data: txParams?.data,
                    },
                  ],
                };

                ppomUtil.validateRequest(reqObject, id);

                const hash = await trx.result;
                this.approveRequest({
                  id: payload.id,
                  result: hash,
                });
              } catch (rejectionError) {
                this.rejectRequest({
                  id: payload.id,
                  error: rejectionError,
                });
              }
              return;
            }

            this.backgroundBridge?.onMessage({
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
    walletConnector.on('disconnect', (error: Error | null) => {
      if (error) {
        throw error;
      }
      this.killSession();
      persistSessions();
    });

    walletConnector.on(
      'session_update',
      (error: Error | null, payload: unknown) => {
        Logger.log('WC: Session update', payload);
        if (error) {
          throw error;
        }
      },
    );

    if (existing) {
      this.startSession(options.session, existing);
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
            : (this.redirectUrl as string),
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

  approveRequest = ({ id, result }: WCApproveRequestArgs) => {
    this.walletConnector?.approveRequest({
      id,
      result,
    });
    this.needsRedirect(id);
  };

  rejectRequest = ({ id, error }: WCRejectRequestArgs) => {
    this.walletConnector?.rejectRequest({
      id,
      error: error as Error,
    });
    this.needsRedirect(id);
  };

  updateSession = ({ chainId, accounts }: WCSessionStatus) => {
    this.walletConnector?.updateSession({
      chainId,
      accounts,
    });
  };

  startSession = async (sessionData: WCSessionData, existing?: boolean) => {
    const chainId = selectEvmChainId(store.getState());
    const selectedAddress =
      Engine.context.AccountsController.getSelectedAccount().address?.toLowerCase();
    const approveData: WCSessionStatus = {
      chainId: parseInt(chainId, 10),
      accounts: [selectedAddress],
    };
    if (existing) {
      this.walletConnector?.updateSession(approveData);
    } else {
      await this.walletConnector?.approveSession(approveData);
      persistSessions();
    }

    this.url.current = sessionData.peerMeta?.url ?? '';
    this.title.current = sessionData.peerMeta?.name ?? '';
    // WalletConnect v1 peers provide icon URLs; downstream consumers accept them as-is.
    this.icon.current = sessionData.peerMeta?.icons?.[0] as unknown as
      | ImageSourcePropType
      | undefined;
    this.dappScheme.current = sessionData.peerMeta?.dappScheme;

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
          injectHomePageScripts: () => null,
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

  sessionRequest = async (peerInfo: WCSessionData) => {
    const { ApprovalController } = Engine.context;
    try {
      const { host } = new URLParse(peerInfo.peerMeta?.url ?? '');
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
      const sessions: WCSessionData[] = JSON.parse(sessionData);

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
      .filter((connector) => connector?.walletConnector?.connected)
      .map((connector) => ({
        ...connector.walletConnector?.session,
      }));
    if (sessions.length >= AppConstants.WALLET_CONNECT.LIMIT_SESSIONS) {
      await this.killSession(sessions[0].peerId);
    }

    const data: WCConnectorOptions = { uri, session: {} };
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
  getSessions: async (): Promise<WCSessionData[]> => {
    let sessions: WCSessionData[] = [];
    const sessionData = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
    if (sessionData) {
      sessions = JSON.parse(sessionData);
    }
    return sessions;
  },
  killSession: async (id?: string) => {
    // 1) First kill the session
    const connectorToKill = connectors.find(
      (connector) => connector?.walletConnector?.session.peerId === id,
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
  isValidUri(uri: string) {
    const result = parseWalletConnectUri(uri);
    if (!result.handshakeTopic || !result.bridge || !result.key) {
      return false;
    }
    return true;
  },
  getValidUriFromDeeplink(uri: string) {
    const prefix = 'wc://wc?uri=';
    return uri.replace(prefix, '');
  },
  isSessionConnected(uri: string) {
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
