/**
 * Utility type definitions.
 *
 * Re-exports utility types from the canonical `../types.ts`.
 *
 * ## Types
 * - `TotalFiatBalance` — Return type of `Engine.getTotalEvmFiatAccountBalance()`.
 * - `SnapPreferences` — Subset of user preferences passed to snaps.
 *
 * ## Pattern
 * - Extract inline return types from Engine methods into named types in `../types.ts`.
 * - Prefer explicit types over inferred ones for public API surfaces.
 * - Keep utility types close to their domain.
 */
export type { TotalFiatBalance, SnapPreferences } from '../types';
