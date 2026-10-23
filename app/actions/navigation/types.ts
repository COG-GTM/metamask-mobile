import { type Action as ReduxAction } from 'redux';

/**
 * Navigation action type enum
 */
export enum NavigationActionType {
  ON_NAVIGATION_READY = 'ON_NAVIGATION_READY',
  SET_CURRENT_ROUTE = 'SET_CURRENT_ROUTE',
  SET_CURRENT_BOTTOM_NAV_ROUTE = 'SET_CURRENT_BOTTOM_NAV_ROUTE',
}

export { NavigationActionType as ActionType };

export type OnNavigationReadyAction =
  ReduxAction<NavigationActionType.ON_NAVIGATION_READY>;

export type SetCurrentRouteAction =
  ReduxAction<NavigationActionType.SET_CURRENT_ROUTE> & {
    payload: { route: string };
  };

export type SetCurrentBottomNavRouteAction =
  ReduxAction<NavigationActionType.SET_CURRENT_BOTTOM_NAV_ROUTE> & {
    payload: { route: string };
  };

/**
 * Navigation action
 */
export type NavigationAction =
  | OnNavigationReadyAction
  | SetCurrentRouteAction
  | SetCurrentBottomNavRouteAction;

export type Action = NavigationAction;
