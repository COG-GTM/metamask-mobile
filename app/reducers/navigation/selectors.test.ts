import {
  selectCurrentBottomNavRoute,
  selectCurrentRoute,
  selectNavigationState,
} from './selectors';
import type { RootState } from '..';

const makeState = (
  currentRoute: string | undefined,
  currentBottomNavRoute: string | undefined,
) =>
  ({
    navigation: {
      currentRoute,
      currentBottomNavRoute,
    },
  } as unknown as RootState);

describe('navigation reducer selectors', () => {
  it('selectNavigationState returns the navigation slice', () => {
    const state = makeState('Wallet', 'Wallet');
    expect(selectNavigationState(state)).toEqual({
      currentRoute: 'Wallet',
      currentBottomNavRoute: 'Wallet',
    });
  });

  it('selectCurrentRoute returns the currentRoute', () => {
    expect(selectCurrentRoute(makeState('Send', 'Wallet'))).toBe('Send');
  });

  it('selectCurrentBottomNavRoute returns the currentBottomNavRoute', () => {
    expect(
      selectCurrentBottomNavRoute(makeState('Send', 'Activity')),
    ).toBe('Activity');
  });
});
