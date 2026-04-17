import navigationReducer, {
  initialNavigationState,
  getCurrentRoute,
  getCurrentBottomNavRoute,
} from './index';
import { NavigationActionType } from '../../actions/navigation/types';

describe('navigation reducer', () => {
  it('returns initial state', () => {
    const result = navigationReducer(undefined, {} as any);
    expect(result).toEqual(initialNavigationState);
  });

  it('handles SET_CURRENT_ROUTE', () => {
    const action = {
      type: NavigationActionType.SET_CURRENT_ROUTE,
      payload: { route: 'Settings' },
    };
    const result = navigationReducer(initialNavigationState, action);
    expect(result.currentRoute).toBe('Settings');
  });

  it('handles SET_CURRENT_BOTTOM_NAV_ROUTE', () => {
    const action = {
      type: NavigationActionType.SET_CURRENT_BOTTOM_NAV_ROUTE,
      payload: { route: 'Browser' },
    };
    const result = navigationReducer(initialNavigationState, action);
    expect(result.currentBottomNavRoute).toBe('Browser');
  });

  it('returns same state for unknown action', () => {
    const result = navigationReducer(initialNavigationState, { type: 'UNKNOWN' } as any);
    expect(result).toEqual(initialNavigationState);
  });
});

describe('navigation selectors', () => {
  const state = {
    navigation: {
      currentRoute: 'SendView',
      currentBottomNavRoute: 'Wallet',
    },
  };

  it('getCurrentRoute returns current route', () => {
    expect(getCurrentRoute(state)).toBe('SendView');
  });

  it('getCurrentBottomNavRoute returns bottom nav route', () => {
    expect(getCurrentBottomNavRoute(state)).toBe('Wallet');
  });
});
