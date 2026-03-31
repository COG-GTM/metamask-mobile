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
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connectors: any[] = [];
let initialized = false;
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tempCallIds: any[] = [];

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

const persistSessions = async (): Promise<void> => {
  const sessions = connectors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((connector: any) => connector?.walletConnector?.connected)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((connector: any) => ({
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

class WalletConnect {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redirectUrl: any = null;
  autosign = false;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backgroundBridge: any = null;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  url: any = { current: null };
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  title: any = { current: null };
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any = { current: null };
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dappScheme: any = { current: null };
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestsToRedirect: any = {};
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hostname: any = null;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestOriginatedFrom: any = null;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletConnector: any;

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(options: any, existing?: boolean) {
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
     *  Subscribe to session requests
     */
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.walletConnector.on('session_request', async (error: any, payload: any) => {
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
     *  Subscribe to call requests
     */
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.walletConnector.on('call_request', async (error: any, payload: any) => {
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
        if (payloadHostname === this.backgroundBridge.hostname) {
          // TODO: Replace "any" with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((METHODS_TO_REDIRECT as any)[payload.method]) {
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

              // TODO: Replace "any" with type
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              checkActiveAccountAndChainId({
                address: payload.params[0].from,
                chainId,
                isWalletConnect: true,
                activeAccounts: [selectedAddress],
                hostname: payloadHostname,
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

              // TODO: Replace "any" with type
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ppomUtil.validateRequest(reqObject as any, id);

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
            origin: this.hostname,
          });
        }
      }

      // Clean call ids
      tempCallIds.length = 0;
    });

    /**
     *	Subscribe to disconnect
     */
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.walletConnector.on('disconnect', (error: any) => {
      if (error) {
        throw error;
      }
      this.killSession();
      persistSessions();
    });

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.walletConnector.on('session_update', (error: any, payload: any) => {
      Logger.log('WC: Session update', payload);
      if (error) {
        throw error;
      }
    });

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
            : this.redirectUrl,
        );
      } else {
        Minimizer.goBack();
      }
    }, 300);
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  needsRedirect = (id: any) => {
    if (this.requestsToRedirect[id]) {
      delete this.requestsToRedirect[id];
      this.redirect();
    }
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  approveRequest = ({ id, result }: any) => {
    this.walletConnector.approveRequest({
      id,
      result,
    });
    this.needsRedirect(id);
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rejectRequest = ({ id, error }: any) => {
    this.walletConnector.rejectRequest({
      id,
      error,
    });
    this.needsRedirect(id);
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSession = ({ chainId, accounts }: any) => {
    this.walletConnector.updateSession({
      chainId,
      accounts,
    });
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startSession = async (sessionData: any, existing?: boolean) => {
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

    this.url.current = sessionData.peerMeta.url;
    this.title.current = sessionData.peerMeta?.name;
    this.icon.current = sessionData.peerMeta?.icons?.[0];
    this.dappScheme.current = sessionData.peerMeta?.dappScheme;

    this.hostname = new URL(this.url.current).hostname;

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.backgroundBridge = new (BackgroundBridge as any)({
      webview: null,
      url: this.url.current,
      isWalletConnect: true,
      wcWalletConnector: this.walletConnector,
      wcRequestActions: {
        approveRequest: this.approveRequest,
        rejectRequest: this.rejectRequest,
        updateSession: this.updateSession,
      },
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getRpcMethodMiddleware: ({ hostname, getProviderState }: any) =>
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getRpcMethodMiddleware({
          hostname: WALLET_CONNECT_ORIGIN + this.hostname,
          getProviderState,
          navigation: null, //props.navigation,
          // Website info
          url: this.url,
          title: this.title,
          icon: this.icon,
          // Bookmarks
          isHomepage: false,
          // Show autocomplete
          fromHomepage: false,
          toggleUrlModal: () => null,
          // Wizard
          wizardScrollAdjusted: () => null,
          tabId: false,
          isWalletConnect: true,
        } as any),
      isMainFrame: true,
    });
  };

  killSession = () => {
    this.backgroundBridge?.onDisconnect();
    this.walletConnector && this.walletConnector.killSession();
    this.walletConnector = null;
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessionRequest = async (peerInfo: any) => {
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
  async init() {
    const sessionData = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
    if (sessionData) {
      const sessions = JSON.parse(sessionData);

      // TODO: Replace "any" with type
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
  connectors() {
    return connectors;
  },
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async newSession(uri: string, redirectUrl?: string, autosign?: boolean, requestOriginatedFrom?: string) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((connector: any) => connector?.walletConnector?.connected)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((connector: any) => ({
        ...connector.walletConnector.session,
      }));
    if (sessions.length >= AppConstants.WALLET_CONNECT.LIMIT_SESSIONS) {
      await this.killSession(sessions[0].peerId);
    }

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { uri, session: {} };
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
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSessions: async (): Promise<any[]> => {
    let sessions = [];
    const sessionData = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
    if (sessionData) {
      sessions = JSON.parse(sessionData);
    }
    return sessions;
  },
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  killSession: async (id: any) => {
    // 1) First kill the session
    const connectorToKill = connectors.find(
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (connector: any) =>
        connector &&
        connector.walletConnector &&
        connector.walletConnector.session.peerId === id,
    );
    if (connectorToKill) {
      await connectorToKill.killSession();
    }
    // 2) Remove from the list of connectors
    connectors = connectors.filter(
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (connector: any) =>
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
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return connectors.some(({ walletConnector }: any) => {
      if (!walletConnector) {
        return false;
      }
      const { handshakeTopic, key } = walletConnector.session;
      return handshakeTopic === wcUri.handshakeTopic && key === wcUri.key;
    });
  },
};

export default instance;
