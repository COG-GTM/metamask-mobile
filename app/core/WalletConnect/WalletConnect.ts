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

const hub = new EventEmitter();
interface WalletSession {
  redirectUrl?: string;
  autosign?: boolean;
  requestOriginatedFrom?: string;
  peerId?: string;
  handshakeTopic?: string;
  key?: string;
  lastTimeConnected?: Date | string;
  peerMeta: {
    url: string;
    name?: string;
    icons?: string[];
    dappScheme?: string;
  };
}

interface WalletPayload {
  id: string | number;
  method?: string;
  params: Array<Record<string, unknown>>;
}

interface WalletConnector {
  connected: boolean;
  session: WalletSession;
  on: (
    event: string,
    callback: (error: unknown, payload: WalletPayload) => void,
  ) => void;
  approveRequest: (request: { id: string | number; result: unknown }) => void;
  rejectRequest: (request: { id: string | number; error: unknown }) => void;
  updateSession: (session: { chainId: number; accounts: string[] }) => void;
  approveSession: (session: { chainId: number; accounts: string[] }) => Promise<void>;
  rejectSession: () => void;
  killSession: () => void;
}

interface WalletOptions {
  session: Partial<WalletSession>;
  uri?: string;
}

interface CallParams {
  chainId: string;
  from: string;
  to?: string;
  value?: string;
  data?: string;
}

interface SessionData extends WalletSession {
  autosign?: boolean;
  redirectUrl?: string;
  requestOriginatedFrom?: string;
}

let connectors: WalletConnect[] = [];
let initialized = false;
const tempCallIds: Array<string | number> = [];

const METHODS_TO_REDIRECT = {
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
  walletConnector!: WalletConnector;
  redirectUrl: string | null = null;
  autosign = false;
  backgroundBridge: BackgroundBridge | null = null;
  url: { current: string | null } = { current: null };
  title: { current: string | null | undefined } = { current: null };
  icon: { current: string | null | undefined } = { current: null };
  dappScheme: { current: string | null | undefined } = { current: null };
  requestsToRedirect: Record<string | number, boolean> = {};
  hostname: string | null = null;
  requestOriginatedFrom: string | null = null;

  constructor(options: WalletOptions, existing = false) {
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
    } as never) as unknown as WalletConnector;
    /**
     *  Subscribe to session requests
     */
    this.walletConnector.on('session_request', async (error, payload) => {
      Logger.log('WC session_request:', payload);
      if (error) {
        throw error;
      }

      await waitForKeychainUnlocked();

      try {
        const sessionData = {
          ...(payload.params[0] as Record<string, unknown>),
          autosign: this.autosign,
          redirectUrl: this.redirectUrl,
          requestOriginatedFrom: this.requestOriginatedFrom,
        };

        Logger.log('WC:', sessionData);

        await waitForInitialization();
        await this.sessionRequest(sessionData as unknown as SessionData);

        await this.startSession(sessionData as unknown as SessionData, existing);

        this.redirect();
      } catch (e) {
        this.walletConnector.rejectSession();
        this.redirect();
      }
    });

    /**
     *  Subscribe to call requests
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
        const payloadUrl = this.walletConnector.session.peerMeta.url;
        const payloadHostname = new URL(payloadUrl).hostname;
        if (
          payloadHostname ===
          (this.backgroundBridge as BackgroundBridge).hostname
        ) {
          if ((METHODS_TO_REDIRECT as Record<string, boolean>)[payload.method]) {
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

              const callParams = payload.params[0] as unknown as CallParams;
              const chainId = callParams.chainId;

              checkActiveAccountAndChainId({
                address: callParams.from,
                chainId,
                isWalletConnect: true,
                activeAccounts: [selectedAddress],
                hostname: payloadHostname,
              } as never);

              const { NetworkController } = Engine.context;
              const networkClientId =
                NetworkController.findNetworkClientIdByChainId(
                  chainId as `0x${string}`,
                );

              const trx = await addTransaction(callParams as never, {
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
                    from: callParams.from,
                    to: callParams.to,
                    value: callParams?.value,
                    data: callParams?.data,
                  },
                ],
              };

              ppomUtil.validateRequest(reqObject as never, id);

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

          (this.backgroundBridge as BackgroundBridge).onMessage({
            name: 'walletconnect-provider',
            data: payload,
            origin: this.hostname,
          } as never);
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
      this.startSession(options.session as unknown as SessionData, existing);
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

  needsRedirect = (id: string | number) => {
    if (this.requestsToRedirect[id]) {
      delete this.requestsToRedirect[id];
      this.redirect();
    }
  };

  approveRequest = ({
    id,
    result,
  }: {
    id: string | number;
    result: unknown;
  }) => {
    this.walletConnector.approveRequest({
      id,
      result,
    });
    this.needsRedirect(id);
  };

  rejectRequest = ({
    id,
    error,
  }: {
    id: string | number;
    error: unknown;
  }) => {
    this.walletConnector.rejectRequest({
      id,
      error,
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

  startSession = async (sessionData: SessionData, existing = false) => {
    const chainId = selectEvmChainId(store.getState()) as string;
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

    this.url.current = sessionData.peerMeta.url;
    this.title.current = sessionData.peerMeta?.name;
    this.icon.current = sessionData.peerMeta?.icons?.[0];
    this.dappScheme.current = sessionData.peerMeta?.dappScheme;

    this.hostname = new URL(this.url.current as string).hostname;

    this.backgroundBridge = new BackgroundBridge({
      webview: null,
      url: this.url.current as string,
      isWalletConnect: true,
      wcWalletConnector: this.walletConnector,
      wcRequestActions: {
        approveRequest: this.approveRequest,
        rejectRequest: this.rejectRequest,
        updateSession: this.updateSession,
      },
      getRpcMethodMiddleware: ({
        hostname,
        getProviderState,
      }: {
        hostname: string;
        getProviderState: unknown;
      }) =>
        getRpcMethodMiddleware({
          hostname: WALLET_CONNECT_ORIGIN + this.hostname,
          getProviderState: getProviderState as never,
          navigation: null, //props.navigation,
          // Website info
          url: this.url as never,
          title: this.title as never,
          icon: this.icon as never,
          // Bookmarks
          isHomepage: false,
          // Show autocomplete
          fromHomepage: false,
          toggleUrlModal: () => null,
          // Wizard
          wizardScrollAdjusted: () => null,
          tabId: false,
          isWalletConnect: true,
        } as never),
      isMainFrame: true,
    });
  };

  killSession = () => {
    this.backgroundBridge?.onDisconnect();
    this.walletConnector && this.walletConnector.killSession();
    this.walletConnector = null as unknown as WalletConnector;
  };

  sessionRequest = async (peerInfo: SessionData) => {
    const { ApprovalController } = Engine.context;
    try {
      const { host } = new URL(peerInfo.peerMeta.url);
      return await ApprovalController.add({
        id: random(),
        origin: host,
        requestData: peerInfo as never,
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
      const sessions = JSON.parse(sessionData) as SessionData[];

      sessions.forEach((session: SessionData) => {
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
        ...connector.walletConnector.session,
      }));
    if (sessions.length >= AppConstants.WALLET_CONNECT.LIMIT_SESSIONS) {
      await this.killSession(sessions[0].peerId as string);
    }

    const data = { uri, session: {} } as unknown as WalletOptions;
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
    let sessions: SessionData[] = [];
    const sessionData = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
    if (sessionData) {
      sessions = JSON.parse(sessionData) as SessionData[];
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
