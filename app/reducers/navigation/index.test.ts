import navigationReducer, {
  initialNavigationState,
  getCurrentRoute,
  getCurrentBottomNavRoute,
} from './';
import { NavigationActionType } from '../../actions/navigation/types';

describe('navigationReducer', () => {
  it('should return the initial state', () => {
    const result = navigationReducer(undefined, {
      type: NavigationActionType.ON_NAVIGATION_READY,
    });
    expect(result).toEqual(initialNavigationState);
  });

  it('should have correct initial state values', () => {
    expect(initialNavigationState).toEqual({
      currentRoute: 'WalletView',
      currentBottomNavRoute: 'Wallet',
    });
  });

  describe('SET_CURRENT_ROUTE', () => {
    it('should update currentRoute', () => {
      const result = navigationReducer(initialNavigationState, {
        type: NavigationActionType.SET_CURRENT_ROUTE,
        payload: { route: 'Settings' },
      });
      expect(result.currentRoute).toBe('Settings');
      expect(result.currentBottomNavRoute).toBe('Wallet');
    });
  });

  describe('SET_CURRENT_BOTTOM_NAV_ROUTE', () => {
    it('should update currentBottomNavRoute', () => {
      const result = navigationReducer(initialNavigationState, {
        type: NavigationActionType.SET_CURRENT_BOTTOM_NAV_ROUTE,
        payload: { route: 'Browser' },
      });
      expect(result.currentBottomNavRoute).toBe('Browser');
      expect(result.currentRoute).toBe('WalletView');
    });
  });

  it('should return state unchanged for unknown action', () => {
    const state = { currentRoute: 'TestRoute', currentBottomNavRoute: 'TestNav' };
    const result = navigationReducer(state, {
      type: NavigationActionType.ON_NAVIGATION_READY,
    });
    expect(result).toBe(state);
  });
});

describe('selectors', () => {
  describe('getCurrentRoute', () => {
    it('should return the current route from state', () => {
      const state = {
        navigation: { currentRoute: 'Settings', currentBottomNavRoute: 'Wallet' },
      };
      expect(getCurrentRoute(state)).toBe('Settings');
    });
  });

  describe('getCurrentBottomNavRoute', () => {
    it('should return the current bottom nav route from state', () => {
      const state = {
        navigation: { currentRoute: 'WalletView', currentBottomNavRoute: 'Browser' },
      };
      expect(getCurrentBottomNavRoute(state)).toBe('Browser');
    });
  });
});
