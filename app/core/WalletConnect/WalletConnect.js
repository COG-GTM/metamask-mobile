/**
 * WalletConnect v1 has been removed.
 * All WalletConnect sessions now use v2 only via WC2Manager.
 *
 * This file is kept as a stub to prevent import errors from any
 * remaining references. All methods are no-ops that log deprecation warnings.
 */
// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';

const hub = new EventEmitter();

const instance = {
  async init() {
    console.warn(
      'WalletConnect v1 has been removed. Use WC2Manager for v2 sessions.',
    );
  },
  connectors() {
    return [];
  },
  async newSession() {
    console.warn(
      'WalletConnect v1 has been removed. Use WC2Manager for v2 sessions.',
    );
  },
  getSessions: async () => [],
  killSession: async () => {},
  hub,
  isValidUri() {
    return false;
  },
  getValidUriFromDeeplink(uri) {
    return uri;
  },
  isSessionConnected() {
    return false;
  },
};

export default instance;
