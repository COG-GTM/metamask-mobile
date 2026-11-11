import { ImageSourcePropType } from 'react-native';
import AppConstants from '../../AppConstants';
import getRpcMethodMiddleware from '../../RPCMethods/RPCMethodMiddleware';
import { DappClient } from './dapp-sdk-types';
import { INTERNAL_ORIGINS } from '../../../constants/transaction';

const isInternalOrigin = (value?: string) => {
  if (!value) {
    return false;
  }
  const strippedValue = value
    .split(AppConstants.MM_SDK.SDK_REMOTE_ORIGIN)
    .join('');
  return INTERNAL_ORIGINS.some(
    (internalOrigin) =>
      internalOrigin &&
      (value === internalOrigin || strippedValue === internalOrigin),
  );
};

export const getSdkClientHostname = (clientInfo: DappClient): string => {
  const hostname =
    clientInfo.originatorInfo.url ?? clientInfo.originatorInfo.title;
  if (
    isInternalOrigin(clientInfo.originatorInfo.url) ||
    isInternalOrigin(clientInfo.originatorInfo.title)
  ) {
    return clientInfo.clientId;
  }
  return hostname;
};

const getDefaultBridgeParams = (clientInfo: DappClient) => ({
  getApprovedHosts: (host: string) => ({
    [host]: true,
  }),
  remoteConnHost: getSdkClientHostname(clientInfo),
  getRpcMethodMiddleware: ({
    getProviderState,
  }: {
    hostname: string;
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getProviderState: any;
  }) =>
    getRpcMethodMiddleware({
      hostname: getSdkClientHostname(clientInfo),
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
