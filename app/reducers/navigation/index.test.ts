import navigationReducer, {
  initialNavigationState,
  getCurrentRoute,
  getCurrentBottomNavRoute,
} from '.';
import { NavigationActionType } from '../../actions/navigation/types';

describe('Navigation Reducer', () => {
  it('should return initial state', () => {
    expect(navigationReducer(undefined, { type: '' } as any)).toStrictEqual(initialNavigationState);
  });

  it('should handle SET_CURRENT_ROUTE', () => {
    const result = navigationReducer(initialNavigationState, {
      type: NavigationActionType.SET_CURRENT_ROUTE,
      payload: { route: 'Settings' },
    });

    expect(result.currentRoute).toBe('Settings');
  });

  it('should handle SET_CURRENT_BOTTOM_NAV_ROUTE', () => {
    const result = navigationReducer(initialNavigationState, {
      type: NavigationActionType.SET_CURRENT_BOTTOM_NAV_ROUTE,
      payload: { route: 'Browser' },
    });

    expect(result.currentBottomNavRoute).toBe('Browser');
  });

  it('should return state for unknown action', () => {
    expect(
      navigationReducer(initialNavigationState, { type: 'UNKNOWN' } as any),
    ).toStrictEqual(initialNavigationState);
  });

  describe('selectors', () => {
    it('getCurrentRoute should return currentRoute', () => {
      expect(getCurrentRoute({ navigation: { currentRoute: 'Home' } })).toBe('Home');
    });

    it('getCurrentBottomNavRoute should return currentBottomNavRoute', () => {
      expect(getCurrentBottomNavRoute({ navigation: { currentBottomNavRoute: 'Wallet' } })).toBe('Wallet');
    });
  });
});
