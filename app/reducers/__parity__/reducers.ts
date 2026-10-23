import type { Reducer } from 'redux';
import transaction from '../transaction';
import security from '../security';
import accounts from '../accounts';
import settings from '../settings';
import user from '../user';
import onboarding from '../onboarding';
import browser from '../browser';
import bookmarks from '../bookmarks';
import notification from '../notification';
import collectibles from '../collectibles';
import modals from '../modals';
import alertReducer from '../alert';
import wizard from '../wizard';
import privacy from '../privacy';
import infuraAvailability from '../infuraAvailability';
import legalNotices from '../legalNotices';
import signatureRequest from '../signatureRequest';
import rpcEvents from '../rpcEvents';
import sdk from '../sdk';
import networkOnboarded from '../networkSelector';
import experimentalSettings from '../experimentalSettings';
import navigation from '../navigation';

/** In-scope reducers keyed by their combineReducers key (default exports only). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const REDUCERS: Record<string, Reducer<any, any>> = {
  transaction,
  security,
  accounts,
  settings,
  user,
  onboarding,
  browser,
  bookmarks,
  notification,
  collectibles,
  modals,
  alert: alertReducer,
  wizard,
  privacy,
  infuraAvailability,
  legalNotices,
  signatureRequest,
  rpcEvents,
  sdk,
  networkOnboarded,
  experimentalSettings,
  navigation,
};
