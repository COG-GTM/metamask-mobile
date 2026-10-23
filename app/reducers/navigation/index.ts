import { createSlice } from '@reduxjs/toolkit';
import {
  NavigationActionType,
  type SetCurrentBottomNavRouteAction,
  type SetCurrentRouteAction,
} from '../../actions/navigation/types';
import { NavigationState } from './types';

export * from './types';

export * from './selectors';

/**
 * Initial navigation state
 */
export const initialNavigationState: NavigationState = {
  currentRoute: 'WalletView',
  currentBottomNavRoute: 'Wallet',
};

export const initialState = initialNavigationState;

const navigationSlice = createSlice({
  name: 'navigation',
  initialState: initialNavigationState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        NavigationActionType.SET_CURRENT_ROUTE,
        (state, action: SetCurrentRouteAction) => ({
          ...state,
          currentRoute: action.payload.route,
        }),
      )
      .addCase(
        NavigationActionType.SET_CURRENT_BOTTOM_NAV_ROUTE,
        (state, action: SetCurrentBottomNavRouteAction) => ({
          ...state,
          currentBottomNavRoute: action.payload.route,
        }),
      );
  },
});

/**
 * Navigation reducer
 */
const navigationReducer = navigationSlice.reducer;

/**
 * Selectors
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCurrentRoute = (state: any) => state.navigation.currentRoute;
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCurrentBottomNavRoute = (state: any) =>
  state.navigation.currentBottomNavRoute;

export default navigationReducer;
