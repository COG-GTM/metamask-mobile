import navigationReducer, {
  initialNavigationState,
  getCurrentRoute,
  getCurrentBottomNavRoute,
} from './index';
import {
  selectNavigationState,
  selectCurrentRoute,
  selectCurrentBottomNavRoute,
} from './selectors';
import {
  setCurrentRoute,
  setCurrentBottomNavRoute,
  onNavigationReady,
  NavigationActionType,
} from '../../actions/navigation';
import { RootState } from '..';

describe('navigationReducer', () => {
  it('returns the initial state', () => {
    expect(navigationReducer(undefined, onNavigationReady())).toEqual(
      initialNavigationState,
    );
  });

  it('sets the current route', () => {
    const state = navigationReducer(
      initialNavigationState,
      setCurrentRoute('SettingsView'),
    );
    expect(state.currentRoute).toBe('SettingsView');
    expect(state.currentBottomNavRoute).toBe(
      initialNavigationState.currentBottomNavRoute,
    );
  });

  it('sets the current bottom nav route', () => {
    const state = navigationReducer(
      initialNavigationState,
      setCurrentBottomNavRoute('Browser'),
    );
    expect(state.currentBottomNavRoute).toBe('Browser');
  });

  it('returns the same state for unrelated actions', () => {
    expect(
      navigationReducer(initialNavigationState, onNavigationReady()),
    ).toBe(initialNavigationState);
  });
});

describe('navigation actions', () => {
  it('creates actions', () => {
    expect(setCurrentRoute('A')).toEqual({
      type: NavigationActionType.SET_CURRENT_ROUTE,
      payload: { route: 'A' },
    });
    expect(setCurrentBottomNavRoute('B')).toEqual({
      type: NavigationActionType.SET_CURRENT_BOTTOM_NAV_ROUTE,
      payload: { route: 'B' },
    });
    expect(onNavigationReady()).toEqual({
      type: NavigationActionType.ON_NAVIGATION_READY,
    });
  });
});

describe('navigation selectors', () => {
  const state = {
    navigation: { currentRoute: 'Foo', currentBottomNavRoute: 'Bar' },
  } as unknown as RootState;

  it('selects the navigation state and its fields', () => {
    expect(selectNavigationState(state)).toEqual(state.navigation);
    expect(selectCurrentRoute(state)).toBe('Foo');
    expect(selectCurrentBottomNavRoute(state)).toBe('Bar');
    expect(getCurrentRoute(state)).toBe('Foo');
    expect(getCurrentBottomNavRoute(state)).toBe('Bar');
  });
});
