import { ImageSourcePropType } from 'react-native';
import AppConstants from '../../AppConstants';
import getRpcMethodMiddleware from '../../RPCMethods/RPCMethodMiddleware';
import { DappClient } from './dapp-sdk-types';

/**
 * Builds the RPC request origin for a deeplink or Android SDK session.
 *
 * The origin is scoped to the channel id and never derived from the
 * dapp-reported `originatorInfo`, so a dapp cannot claim an internal origin.
 *
 * @param clientInfo - The connected SDK dapp client.
 * @returns `MMSDKREMOTE::<channelId>`.
 */
export const getSDKRemoteOrigin = (clientInfo: DappClient) =>
  `${AppConstants.MM_SDK.SDK_REMOTE_ORIGIN}${clientInfo.clientId}`;

const getDefaultBridgeParams = (clientInfo: DappClient) => ({
  getApprovedHosts: (host: string) => ({
    [host]: true,
  }),
  remoteConnHost: getSDKRemoteOrigin(clientInfo),
  getRpcMethodMiddleware: ({
    getProviderState,
  }: {
    hostname: string;
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getProviderState: any;
  }) =>
    getRpcMethodMiddleware({
      hostname: getSDKRemoteOrigin(clientInfo),
      channelId: clientInfo.clientId,
      getProviderState,
      isMMSDK: true,
      navigation: null, //props.navigation,
      // Website info
      url: {
        current: clientInfo.originatorInfo?.url,
      },
      title: {
        current: clientInfo.originatorInfo?.title,
      },
      icon: {
        current: clientInfo.originatorInfo?.icon as ImageSourcePropType, // TODO: Need to change the type at the @metamask/sdk-communication-layer from string to ImageSourcePropType
      },
      // Bookmarks
      isHomepage: () => false,
      // Show autocomplete
      fromHomepage: { current: false },
      // Wizard
      wizardScrollAdjusted: { current: false },
      tabId: '',
      isWalletConnect: false,
      analytics: {
        isRemoteConn: true,
        platform:
          clientInfo.originatorInfo.platform ??
          AppConstants.MM_SDK.UNKNOWN_PARAM,
      },
      toggleUrlModal: () => null,
      injectHomePageScripts: () => null,
    }),
  isMainFrame: true,
  isWalletConnect: false,
  wcRequestActions: undefined,
});

export default getDefaultBridgeParams;
