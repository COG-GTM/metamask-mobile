'use strict';




import handleBrowserUrl from './Handlers/handleBrowserUrl';
import handleEthereumUrl from './Handlers/handleEthereumUrl';
import handleRampUrl from './Handlers/handleRampUrl';
import switchNetwork from './Handlers/switchNetwork';
import parseDeeplink from './ParseManager/parseDeeplink';
import approveTransaction from './TransactionManager/approveTransaction';
import { RampType } from '../../reducers/fiatOrders/types';

class DeeplinkManager {


  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any


  constructor({
    navigation,
    dispatch





  }) {
    this.navigation = navigation;
    this.pendingDeeplink = null;
    this.dispatch = dispatch;
  }

  setDeeplink = (url) => this.pendingDeeplink = url;

  getPendingDeeplink = () => this.pendingDeeplink;

  expireDeeplink = () => this.pendingDeeplink = null;

  /**
   * Method in charge of changing network if is needed
   *
   * @param switchToChainId - Corresponding chain id for new network
   */
  _handleNetworkSwitch = (switchToChainId) =>
  switchNetwork({
    deeplinkManager: this,
    switchToChainId
  });

  _approveTransaction = async (ethUrl, origin) =>
  approveTransaction({
    deeplinkManager: this,
    ethUrl,
    origin
  });

  async _handleEthereumUrl(url, origin) {
    return handleEthereumUrl({
      deeplinkManager: this,
      url,
      origin
    });
  }

  _handleBrowserUrl(url, callback) {
    return handleBrowserUrl({
      deeplinkManager: this,
      url,
      callback
    });
  }

  _handleBuyCrypto(rampPath) {
    handleRampUrl({
      rampPath,
      navigation: this.navigation,
      rampType: RampType.BUY
    });
  }

  _handleSellCrypto(rampPath) {
    handleRampUrl({
      rampPath,
      navigation: this.navigation,
      rampType: RampType.SELL
    });
  }

  parse(
  url,
  {
    browserCallBack,
    origin,
    onHandled




  })
  {
    return parseDeeplink({
      deeplinkManager: this,
      url,
      origin,
      browserCallBack,
      onHandled
    });
  }
}

export default DeeplinkManager;