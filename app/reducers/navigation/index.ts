import { type NavigationAction } from '../../actions/navigation/types';
import { NavigationState } from './types';

export * from './types';

/**
 * Initial navigation state
 */
export const initialNavigationState: NavigationState = {
  currentRoute: 'WalletView',
};

/**
 * Navigation reducer
 */
/* eslint-disable @typescript-eslint/default-param-last */
const navigationReducer = (
  state: NavigationState = initialNavigationState,
  action: NavigationAction,
): NavigationState => {
  switch (action.type) {
    default:
      return state;
  }
};

/**
 * Selectors
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCurrentRoute = (state: any) => state.navigation.currentRoute;

export default navigationReducer;
