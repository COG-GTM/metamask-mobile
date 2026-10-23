import type { AnyAction } from 'redux';
import type { ScenarioStep } from './types';

export const FIXED_NOW = 1729651200000; // 2024-10-23T02:40:00.000Z
export const UNKNOWN_ACTION: AnyAction = { type: '@@parity/UNKNOWN_ACTION' };
export const INIT_ACTION: AnyAction = { type: '@@parity/INIT' };

/** A redux-persist REHYDRATE action as dispatched by persistStore on app start. */
export const rehydrateAction = (payload: Record<string, unknown> = {}) => ({
  type: 'persist/REHYDRATE',
  key: 'root',
  payload,
  err: undefined,
});

/**
 * Builds a step by calling a real exported action creator. Date.now is pinned
 * so creators that stamp ids (browser tabs, history) are deterministic.
 */
export function step(
  label: string,
  creator: string,
  // Legacy JS creators have loosely inferred parameter types; args are recorded verbatim.
  fn: (...args: never[]) => unknown,
  ...args: unknown[]
): ScenarioStep {
  const realNow = Date.now;
  Date.now = () => FIXED_NOW;
  try {
    const action = (fn as (...a: unknown[]) => unknown)(...args);
    return { label, creator, args, action: action as AnyAction };
  } finally {
    Date.now = realNow;
  }
}

/** Builds a step from a literal action (for action types without a creator). */
export function raw(label: string, action: AnyAction): ScenarioStep {
  return { label, creator: 'raw', args: [], action };
}

export const unknownStep = () => raw('unknown action', UNKNOWN_ACTION);
export const initStep = () => raw('init (undefined state)', INIT_ACTION);
export const rehydrateStep = (payload: Record<string, unknown> = {}) =>
  raw('redux-persist REHYDRATE', rehydrateAction(payload));
