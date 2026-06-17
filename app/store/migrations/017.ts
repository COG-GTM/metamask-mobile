interface MigrationState {
  networkOnboarded?: {
    networkOnboardedState?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  if (typedState.networkOnboarded?.networkOnboardedState) {
    typedState.networkOnboarded.networkOnboardedState = {};
  }
  return typedState as unknown as Record<string, unknown>;
}
