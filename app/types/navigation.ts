/**
 * Navigation param list types for the MetaMask Mobile app.
 *
 * These types will be populated as navigation files are migrated to TypeScript.
 * Each navigator should define its own param list and register it here.
 *
 * Reference: https://reactnavigation.org/docs/typescript/
 */

/**
 * Root-level stack navigator param list.
 * Populated during navigation migration (Playbook 10 / Devin C5).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RootStackParamList {
  // TODO: Populate with screen names and their param types during navigation migration
  [key: string]: undefined | Record<string, unknown>;
}

/**
 * Main navigator param list (within authenticated app).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MainNavigatorParamList {
  // TODO: Populate during navigation migration
  [key: string]: undefined | Record<string, unknown>;
}
