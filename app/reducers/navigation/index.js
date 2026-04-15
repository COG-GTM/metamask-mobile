import {

  NavigationActionType } from
'../../actions/navigation/types';


export * from './types';

export * from './selectors';

/**
 * Initial navigation state
 */
export const initialNavigationState = {
  currentRoute: 'WalletView',
  currentBottomNavRoute: 'Wallet'
};

/**
 * Navigation reducer
 */
/* eslint-disable @typescript-eslint/default-param-last */
const navigationReducer = (
state = initialNavigationState,
action) =>
{
  switch (action.type) {
    case NavigationActionType.SET_CURRENT_ROUTE:
      return {
        ...state,
        currentRoute: action.payload.route
      };
    case NavigationActionType.SET_CURRENT_BOTTOM_NAV_ROUTE:
      return {
        ...state,
        currentBottomNavRoute: action.payload.route
      };
    default:
      return state;
  }
};

/**
 * Selectors
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCurrentRoute = (state) => state.navigation.currentRoute;
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCurrentBottomNavRoute = (state) =>
state.navigation.currentBottomNavRoute;

export default navigationReducer;