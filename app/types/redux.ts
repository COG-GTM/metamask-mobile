/**
 * Typed Redux hooks and store utilities for the MetaMask Mobile app.
 *
 * Usage:
 *   import { useAppSelector, useAppDispatch } from '../types/redux';
 *
 * These hooks provide type-safe access to the Redux store without
 * requiring manual type annotations at every call site.
 */
import { useSelector, useDispatch } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '../reducers';
import type { ReduxStore } from '../core/redux';

/**
 * The dispatch type for the MetaMask Mobile Redux store.
 * Inferred from the store itself to include thunk and saga middleware types.
 */
export type AppDispatch = ReduxStore['dispatch'];

/**
 * A typed version of `useSelector` that knows about the `RootState` shape.
 *
 * @example
 * const chainId = useAppSelector(selectChainId);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * A typed version of `useDispatch` that returns `AppDispatch`.
 *
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(someAction());
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
