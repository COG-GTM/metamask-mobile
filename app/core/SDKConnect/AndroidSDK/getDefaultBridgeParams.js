
import AppConstants from '../../AppConstants';
import getRpcMethodMiddleware from '../../RPCMethods/RPCMethodMiddleware';


const getDefaultBridgeParams = (clientInfo) => ({
  getApprovedHosts: (host) => ({
    [host]: true
  }),
  remoteConnHost:
  clientInfo.originatorInfo.url ?? clientInfo.originatorInfo.title,
  getRpcMethodMiddleware: ({
    getProviderState





  }) =>
  getRpcMethodMiddleware({
    hostname:
    clientInfo.originatorInfo.url ?? clientInfo.originatorInfo.title,
    channelId: clientInfo.clientId,
    getProviderState,
    isMMSDK: true,
    navigation: null, //props.navigation,
    // Website info
    url: {
      current: clientInfo.originatorInfo?.url
    },
    title: {
      current: clientInfo.originatorInfo?.title
    },
    icon: {
      current: clientInfo.originatorInfo?.icon // TODO: Need to change the type at the @metamask/sdk-communication-layer from string to ImageSourcePropType
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
      AppConstants.MM_SDK.UNKNOWN_PARAM
    },
    toggleUrlModal: () => null,
    injectHomePageScripts: () => null
  }),
  isMainFrame: true,
  isWalletConnect: false,
  wcRequestActions: undefined
});

export default getDefaultBridgeParams;