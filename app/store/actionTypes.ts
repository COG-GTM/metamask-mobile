import { Action } from 'redux';
import { UserAction } from '../actions/user/types';
import { Action as SecurityAction } from '../actions/security';
import { Action as SdkAction } from '../actions/sdk';
import { OnboardingActionTypes } from '../actions/onboarding';
import { NavigationAction } from '../actions/navigation/types';
import { iEventAction as RpcEventAction } from '../actions/rpcEvents';
import { iAccountActions as AccountAction } from '../actions/accounts';
import { LegalNoticesAction } from '../reducers/legalNotices';
import { Action as FiatOrderAction } from '../reducers/fiatOrders/types';

/**
 * Union of all known Redux action types dispatched through the store.
 *
 * As more JS action files are migrated to TypeScript, their action types
 * should be added to this union and the {@link Action} fallback can eventually
 * be removed.
 */
export type RootAction =
  | UserAction
  | SecurityAction
  | SdkAction
  | OnboardingActionTypes
  | NavigationAction
  | RpcEventAction
  | AccountAction
  | LegalNoticesAction
  | FiatOrderAction
  | Action<string>;
