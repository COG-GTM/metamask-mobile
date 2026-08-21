/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
 */
interface MigrationState {
  recents?: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  if (typedState.recents) {
    delete typedState.recents;
  }
  return state as Record<string, unknown>;
}
