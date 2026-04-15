

import DevLogger from '../SDKConnect/utils/DevLogger';
import DeeplinkManager from './DeeplinkManager';

let instance;

const SharedDeeplinkManager = {
  getInstance: () => instance,
  init: ({
    navigation,
    dispatch





  }) => {
    if (instance) {
      return;
    }
    instance = new DeeplinkManager({
      navigation,
      dispatch
    });
    DevLogger.log(`DeeplinkManager initialized`);
  },
  parse: (
  url,
  args) =>




  instance.parse(url, args),
  setDeeplink: (url) => instance.setDeeplink(url),
  getPendingDeeplink: () => instance.getPendingDeeplink(),
  expireDeeplink: () => instance.expireDeeplink()
};

export default SharedDeeplinkManager;