/* eslint-disable import/prefer-default-export */
import {



  NavigationActionType } from
'./types';

export * from './types';

export const setCurrentRoute = (route) => ({
  type: NavigationActionType.SET_CURRENT_ROUTE,
  payload: { route }
});

export const setCurrentBottomNavRoute = (
route) => (
{
  type: NavigationActionType.SET_CURRENT_BOTTOM_NAV_ROUTE,
  payload: { route }
});

/**
 * Action that is called when navigation is ready
 */
export const onNavigationReady = () => ({
  type: NavigationActionType.ON_NAVIGATION_READY
});