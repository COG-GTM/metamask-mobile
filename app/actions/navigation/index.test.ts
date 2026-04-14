import {
  setCurrentRoute,
  setCurrentBottomNavRoute,
  onNavigationReady,
  NavigationActionType,
} from '.';

describe('Navigation Actions', () => {
  it('setCurrentRoute should return correct action', () => {
    expect(setCurrentRoute('Home')).toStrictEqual({
      type: NavigationActionType.SET_CURRENT_ROUTE,
      payload: { route: 'Home' },
    });
  });

  it('setCurrentBottomNavRoute should return correct action', () => {
    expect(setCurrentBottomNavRoute('Wallet')).toStrictEqual({
      type: NavigationActionType.SET_CURRENT_BOTTOM_NAV_ROUTE,
      payload: { route: 'Wallet' },
    });
  });

  it('onNavigationReady should return correct action', () => {
    expect(onNavigationReady()).toStrictEqual({
      type: NavigationActionType.ON_NAVIGATION_READY,
    });
  });
});
