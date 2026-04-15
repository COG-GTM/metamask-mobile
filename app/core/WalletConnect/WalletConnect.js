/**
 * @deprecated WalletConnect v1 has been removed. All WalletConnect sessions now use v2 only.
 * This module is kept as a stub for backward compatibility with existing imports.
 * Use WalletConnectV2 (WC2Manager) for all WalletConnect functionality.
 */
// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';
import Logger from '../../util/Logger';

const hub = new EventEmitter();

const instance = {
  async init() {
    Logger.log('WalletConnect v1 has been removed. All sessions use v2 only.');
  },
  connectors() {
    return [];
  },
  async newSession() {
    Logger.log('WalletConnect v1 has been removed. Use WalletConnect v2 instead.');
  },
  getSessions: async () => [],
  killSession: async () => {
    // no-op: v1 sessions no longer exist
  },
  hub,
  isValidUri() {
    return false;
  },
  getValidUriFromDeeplink(uri) {
    const prefix = 'wc://wc?uri=';
    return uri.replace(prefix, '');
  },
  isSessionConnected() {
    return false;
  },
};

export default instance;
