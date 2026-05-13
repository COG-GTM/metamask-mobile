/**
 * Shared Redux types for the MetaMask Mobile app.
 *
 * RootState is already defined in app/reducers/index.ts — re-exported here
 * for convenience so that migrated files can import from a single location.
 *
 * AppDispatch will be refined as reducers are migrated to have proper action types.
 */

// Re-export RootState from its canonical location
export type { RootState } from '../reducers';

// AppDispatch — derived from the store once reducers are fully typed.
// For now, use ThunkDispatch to support thunk actions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppDispatch = any;
