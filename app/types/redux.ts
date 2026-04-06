/**
 * Typed Redux hooks and utility types for the MetaMask Mobile app.
 *
 * Usage:
 *   import { useAppSelector, useAppDispatch } from '../types/redux';
 *
 *   const value = useAppSelector((state) => state.settings.foo);
 *   const dispatch = useAppDispatch();
 */
import {
  TypedUseSelectorHook,
  useSelector,
  useDispatch,
} from 'react-redux';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { RootState } from '../reducers';

/**
 * App-wide dispatch type.
 * Includes ThunkDispatch so that useAppDispatch() can dispatch both plain
 * actions and thunks.
 * TODO: Replace AnyAction with a union of all action types once reducers are
 * fully typed.
 */
export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;

/**
 * Pre-typed `useSelector` hook — eliminates the need to type
 * `(state: RootState)` at every call site.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Pre-typed `useDispatch` hook.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
