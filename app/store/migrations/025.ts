interface State025 {
  privacy?: { thirdPartyApiMode?: boolean };
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        showIncomingTransactions?: Record<string, boolean | undefined>;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State025;
  const showIncomingTransactionsObject = {
    '0x1': true,
    '0x5': true,
    '0x38': true,
    '0x61': true,
    '0xa': true,
    '0xa869': true,
    '0xaa37dc': true,
    '0x89': true,
    '0x13881': true,
    '0xa86a': true,
    '0xfa': true,
    '0xfa2': true,
    '0xaa36a7': true,
    '0xe704': true,
    '0xe705': true,
    '0xe708': true,
    '0x504': true,
    '0x507': true,
    '0x505': true,
    '0x64': true,
  };
  const updatedShowIncomingTransactionsObject: Record<
    string,
    boolean | undefined
  > = {};
  for (const key in showIncomingTransactionsObject) {
    updatedShowIncomingTransactionsObject[key] =
      typedState.privacy?.thirdPartyApiMode;
  }
  if (typedState?.engine?.backgroundState?.PreferencesController) {
    typedState.engine.backgroundState.PreferencesController.showIncomingTransactions =
      updatedShowIncomingTransactionsObject;
  }
  if (typedState.privacy) {
    delete typedState.privacy.thirdPartyApiMode;
  }

  return state;
}
