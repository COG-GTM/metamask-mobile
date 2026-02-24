/**
 * Permissive state type used by legacy synchronous migrations (000-027).
 * These migrations predate the `unknown`-based runtime type narrowing
 * approach used in migration 028+. This type preserves the same level
 * of type safety these files had as `.js` under `allowJs: true`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MigrationState = Record<string, any>;
