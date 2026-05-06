import { WalletDevice } from '@metamask/transaction-controller';
import RNWalletConnect from '@walletconnect/client';
// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';
import { Linking } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-shadow
import URL from 'url-parse';
import { v1 as random } from 'uuid';

import ppomUtil from '../../../app/lib/ppom/ppom-util';
import { strings } from '../../../locales/i18n';
import { WALLETCONNECT_SESSIONS } from '../../constants/storage';
import { selectEvmChainId } from '../../selectors/networkController';
import { store } from '../../store';
import StorageWrapper from '../../store/storage-wrapper';
import { msBetweenDates, msToHours } from '../../util/date';
import Logger from '../../util/Logger';
import { addTransaction } from '../../util/transaction-controller';
import {
  CLIENT_OPTIONS,
  WALLET_CONNECT_ORIGIN,
} from '../../util/walletconnect';
import AppConstants from '../AppConstants';
// eslint-disable-next-line @typescript-eslint/no-shadow
import BackgroundBridge from '../BackgroundBridge/BackgroundBridge';
import Engine from '../Engine';
import { Minimizer } from '../NativeModules';
import NotificationManager from '../NotificationManager';
import getRpcMethodMiddleware, {
  ApprovalTypes,
  checkActiveAccountAndChainId,
} from '../RPCMethods/RPCMethodMiddleware';
import { parseWalletConnectUri } from './wc-utils';

interface ClientMeta {
  description: string;
  url: string;
  icons: string[];
  name: string;
  ssl?: boolean;
  scheme?: string;
}

interface IWalletConnectSession {
  connected: boolean;
  accounts: string[];
  chainId: number;
  bridge: string;
  key: string;
  clientId: string;
  clientMeta: ClientMeta | null;
  peerId: string;
  peerMeta: ClientMeta | null;
  handshakeId: number;
  handshakeTopic: string;
}

interface WalletConnectSessionMeta extends Partial<IWalletConnectSession> {
  autosign?: boolean;
  redirectUrl?: string;
  requestOriginatedFrom?: string;
  lastTimeConnected?: Date | string;
}

interface WalletConnectOptions {
  uri?: string;
  session: WalletConnectSessionMeta;
}

interface WalletConnectCallPayload {
  id: number;
  jsonrpc?: string;
  method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
}

interface WalletConnectSessionRequestPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
}

interface ApproveRequestArgs {
  id: number;
  result: unknown;
}

interface RejectRequestArgs {
  id: number;
  error: unknown;
}

interface UpdateSessionArgs {
  chainId: number;
  accounts: string[];
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
      ...(connector.walletConnector?.session ?? {}),
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
  backgroundBridge: InstanceType<typeof BackgroundBridge> | null = null;
  url: { current: string | null } = { current: null };
  title: { current: string | null } = { current: null };
  icon: { current: string | null } = { current: null };
  dappScheme: { current: string | null } = { current: null };
  requestsToRedirect: Record<string, boolean> = {};
  hostname: string | null = null;
  requestOriginatedFrom: string | null = null;
  walletConnector: RNWalletConnect | null = null;

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
    this.walletConnector.on(
      'session_request',
      async (
        error: Error | null,
        payload: WalletConnectSessionRequestPayload,
      ) => {
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
      async (error: Error | null, payload: WalletConnectCallPayload) => {
        if (tempCallIds.includes(payload.id)) return;
        tempCallIds.push(payload.id);

        await waitForKeychainUnlocked();

        Logger.log('CALL_REQUEST', error, payload);
        if (error) {
          throw error;
        }

        if (payload.method) {
          const payloadUrl = this.walletConnector?.session.peerMeta?.url ?? '';
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

                const chainId = payload.params[0].chainId;

                // The original JS call passed an extra `activeAccounts`
                // property that is not part of the typed signature; preserve
                // the runtime call shape via an assertion.
                checkActiveAccountAndChainId({
                  address: payload.params[0].from,
                  chainId,
                  isWalletConnect: true,
                  activeAccounts: [selectedAddress],
                  hostname: payloadHostname,
                } as Parameters<typeof checkActiveAccountAndChainId>[0]);

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

                ppomUtil.validateRequest(
                  reqObject as Parameters<
                    typeof ppomUtil.validateRequest
                  >[0],
                  id,
                );

                const hash = await trx.result;
                this.approveRequest({
                  id: payload.id,
                  result: hash,
                });
              } catch (rejectError) {
                this.rejectRequest({
                  id: payload.id,
                  error: rejectError,
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
        options.session as WalletConnectSessionMeta & {
          peerMeta?: ClientMeta & { dappScheme?: string };
        },
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

  approveRequest = ({ id, result }: ApproveRequestArgs): void => {
    this.walletConnector?.approveRequest({
      id,
      result,
    });
    this.needsRedirect(id);
  };

  rejectRequest = ({ id, error }: RejectRequestArgs): void => {
    this.walletConnector?.rejectRequest({
      id,
      error: error as { code?: number; message: string; data?: string },
    });
    this.needsRedirect(id);
  };

  updateSession = ({ chainId, accounts }: UpdateSessionArgs): void => {
    this.walletConnector?.updateSession({
      chainId,
      accounts,
    });
  };

  startSession = async (
    sessionData: WalletConnectSessionMeta & {
      peerMeta?: ClientMeta & { dappScheme?: string };
    },
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

    this.url.current = sessionData.peerMeta?.url ?? null;
    this.title.current = sessionData.peerMeta?.name ?? null;
    this.icon.current = sessionData.peerMeta?.icons?.[0] ?? null;
    this.dappScheme.current = sessionData.peerMeta?.dappScheme ?? null;

    this.hostname = new URL(this.url.current as string).hostname;

    this.backgroundBridge = new BackgroundBridge({
      webview: null,
      url: this.url.current,
      isWalletConnect: true,
      // The JS BackgroundBridge accepts a `wcWalletConnector` extra option
      // that is not in its inferred constructor type; preserve runtime shape.
      wcWalletConnector: this.walletConnector,
      wcRequestActions: {
        approveRequest: this.approveRequest,
        rejectRequest: this.rejectRequest,
        updateSession: this.updateSession,
      },
      getRpcMethodMiddleware: ({
        getProviderState,
      }: {
        hostname: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getProviderState: any;
      }) =>
        getRpcMethodMiddleware({
          hostname: WALLET_CONNECT_ORIGIN + this.hostname,
          getProviderState,
          navigation: null, //props.navigation,
          // Website info
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          url: this.url as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          title: this.title as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          icon: this.icon as any,
          // Bookmarks
          isHomepage: () => false,
          // Show autocomplete
          fromHomepage: { current: false },
          toggleUrlModal: () => null,
          // Wizard
          wizardScrollAdjusted: { current: false },
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
    if (this.walletConnector) {
      this.walletConnector.killSession();
    }
    this.walletConnector = null;
  };

  sessionRequest = async (peerInfo: {
    peerMeta: { url: string };
  }): Promise<unknown> => {
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

interface WalletConnectInstance {
  init: () => Promise<void>;
  connectors: () => WalletConnect[];
  newSession: (
    uri: string,
    redirectUrl?: string,
    autosign?: boolean,
    requestOriginatedFrom?: string,
  ) => Promise<void>;
  getSessions: () => Promise<WalletConnectSessionMeta[]>;
  killSession: (id: string) => Promise<void>;
  hub: EventEmitter;
  isValidUri: (uri: string) => boolean;
  getValidUriFromDeeplink: (uri: string) => string;
  isSessionConnected: (uri: string) => boolean;
}

const instance: WalletConnectInstance = {
  async init() {
    const sessionData = await StorageWrapper.getItem(WALLETCONNECT_SESSIONS);
    if (sessionData) {
      const sessions: WalletConnectSessionMeta[] = JSON.parse(sessionData);

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
        ...(connector.walletConnector?.session ?? ({} as IWalletConnectSession)),
      }));
    if (sessions.length >= AppConstants.WALLET_CONNECT.LIMIT_SESSIONS) {
      await this.killSession(sessions[0].peerId);
    }

    const data: WalletConnectOptions = {
      uri,
      session: {} as WalletConnectSessionMeta,
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
    connectors.push(new WalletConnect(data));
  },
  getSessions: async (): Promise<WalletConnectSessionMeta[]> => {
    let sessions: WalletConnectSessionMeta[] = [];
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
      return (
        handshakeTopic === wcUri.handshakeTopic && key === wcUri.key
      );
    });
  },
};

export default instance;
