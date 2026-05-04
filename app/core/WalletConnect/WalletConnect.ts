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
// eslint-disable-next-line @typescript-eslint/no-shadow
import URL from 'url-parse';
import { parseWalletConnectUri } from './wc-utils';
import { store } from '../../store';
import { selectEvmChainId } from '../../selectors/networkController';
import ppomUtil from '../../../app/lib/ppom/ppom-util';

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

interface WalletConnectSession {
  redirectUrl?: string;
  autosign?: boolean;
  requestOriginatedFrom?: string;
  peerMeta?: {
    url: string;
    name?: string;
    icons?: string[];
    dappScheme?: string;
  };
  peerId?: string;
  [key: string]: unknown;
}

interface WalletConnectOptions {
  uri?: string;
  session: WalletConnectSession;
}

class WalletConnect {
  redirectUrl: string | null = null;
  autosign: boolean = false;
  backgroundBridge: BackgroundBridge | null = null;
  walletConnector: RNWalletConnect;
  url: { current: string | null } = { current: null };
  title: { current: string | null } = { current: null };
  icon: { current: string | null } = { current: null };
  dappScheme: { current: string | null } = { current: null };
  requestsToRedirect: Record<number, boolean> = {};
  hostname: string | null = null;
  requestOriginatedFrom: string | null = null;

  constructor(options: WalletConnectOptions, existing?: boolean) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    /**
     * Subscribe to session requests
     */
    this.walletConnector.on('session_request', async (error, payload) => {
      Logger.log('WC session_request:', payload);
      if (error) {
        throw error;
      }

      await waitForKeychainUnlocked();

      try {
        const sessionData = {
          ...payload.params[0],
          autosign: this.autosign,
          redirectUrl: this.redirectUrl,
          requestOriginatedFrom: this.requestOriginatedFrom,
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
    });

    /**
     * Subscribe to call requests
     */
    this.walletConnector.on('call_request', async (error, payload) => {
      if (tempCallIds.includes(payload.id)) return;
      tempCallIds.push(payload.id);

      await waitForKeychainUnlocked();

      Logger.log('CALL_REQUEST', error, payload);
      if (error) {
        throw error;
      }

      if (payload.method) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const payloadUrl = this.walletConnector.session.peerMeta!.url;
        const payloadHostname = new URL(payloadUrl).hostname;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (payloadHostname === this.backgroundBridge!.hostname) {
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

              const chainId = payload.params[0].chainId;

              checkActiveAccountAndChainId({
                address: payload.params[0].from,
                chainId,
                isWalletConnect: true,
                activeAccounts: [selectedAddress],
                hostname: payloadHostname,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any);

              const { NetworkController } = Engine.context;
              const networkClientId =
                NetworkController.findNetworkClientIdByChainId(chainId);

              const trx = await addTransaction(payload.params[0], {
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
                    from: payload.params[0].from,
                    to: payload.params[0].to,
                    value: payload.params[0]?.value,
                    data: payload.params[0]?.data,
                  },
                ],
              };

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ppomUtil.validateRequest(reqObject as any, id);

              const hash = await trx.result;
              this.approveRequest({
                id: payload.id,
                result: hash,
              });
            } catch (sendTxError) {
              this.rejectRequest({
                id: payload.id,
                error: sendTxError,
              });
            }
            return;
          }

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.backgroundBridge!.onMessage({
            name: 'walletconnect-provider',
            data: payload,
          });
        }
      }

      // Clean call ids
      tempCallIds.length = 0;
    });

    /**
     *	Subscribe to disconnect
     */
    this.walletConnector.on('disconnect', (error) => {
      if (error) {
        throw error;
      }
      this.killSession();
      persistSessions();
    });

    this.walletConnector.on('session_update', (error, payload) => {
      Logger.log('WC: Session update', payload);
      if (error) {
        throw error;
      }
    });

    if (existing) {
      this.startSession(options.session, existing);
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
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            : this.redirectUrl!,
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
    this.walletConnector.approveRequest({
      id,
      result,
    });
    this.needsRedirect(id);
  };

  rejectRequest = ({ id, error }: { id: number; error: unknown }): void => {
    this.walletConnector.rejectRequest({
      id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: error as any,
    });
    this.needsRedirect(id);
  };

  updateSession = ({ chainId, accounts }: { chainId: number; accounts: string[] }): void => {
    this.walletConnector.updateSession({
      chainId,
      accounts,
    });
  };

  startSession = async (sessionData: WalletConnectSession, existing?: boolean): Promise<void> => {
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.url.current = sessionData.peerMeta!.url;
    this.title.current = sessionData.peerMeta?.name ?? null;
    this.icon.current = sessionData.peerMeta?.icons?.[0] ?? null;
    this.dappScheme.current = sessionData.peerMeta?.dappScheme ?? null;

    this.hostname = new URL(this.url.current).hostname;

    this.backgroundBridge = new BackgroundBridge({
      webview: undefined,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      url: this.url.current!,
      isWalletConnect: true,
      wcWalletConnector: this.walletConnector,
      wcRequestActions: {
        approveRequest: this.approveRequest,
        rejectRequest: this.rejectRequest,
        updateSession: this.updateSession,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getRpcMethodMiddleware: ({ hostname: _hostname, getProviderState }: { hostname: string; getProviderState: any }) =>
        getRpcMethodMiddleware({
          hostname: WALLET_CONNECT_ORIGIN + this.hostname,
          getProviderState,
          navigation: null,
          url: this.url,
          title: this.title,
          icon: this.icon,
          isHomepage: false,
          fromHomepage: false,
          toggleUrlModal: () => null,
          wizardScrollAdjusted: () => null,
          tabId: false,
          isWalletConnect: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
      isMainFrame: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  };

  killSession = (): void => {
    this.backgroundBridge?.onDisconnect();
    this.walletConnector?.killSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.walletConnector = null as any;
  };

  sessionRequest = async (peerInfo: { peerMeta: { url: string } }): Promise<unknown> => {
    const { ApprovalController } = Engine.context;
    try {
      const { host } = new URL(peerInfo.peerMeta.url);
      return await ApprovalController.add({
        id: random(),
        origin: host,
        requestData: peerInfo,
        type: ApprovalTypes.WALLET_CONNECT,
      });
    } catch (error) {
      throw new Error('WalletConnect session request rejected');
    }
  };
}

const instance = {
  async init(): Promise<void> {
    const sessionData = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
    if (sessionData) {
      const sessions = JSON.parse(sessionData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessions.forEach((session: any) => {
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
  async newSession(uri: string, redirectUrl?: string, autosign?: boolean, requestOriginatedFrom?: string): Promise<void> {
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
        ...connector.walletConnector.session,
      }));
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
  getSessions: async (): Promise<WalletConnectSession[]> => {
    let sessions: WalletConnectSession[] = [];
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
