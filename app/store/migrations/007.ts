type TokensByAccount = Record<string, Record<string, unknown[]>>;
type TokensByChainId = Record<string, Record<string, unknown[]>>;

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: TokensByAccount;
        ignoredTokens?: unknown[];
        allIgnoredTokens?: Record<string, Record<string, unknown>>;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const allTokens =
    migratedState.engine.backgroundState.TokensController.allTokens;
  const newAllTokens: TokensByChainId = {};
  if (allTokens) {
    Object.keys(allTokens).forEach((accountAddress) => {
      Object.keys(allTokens[accountAddress]).forEach((chainId) => {
        const tokensArray = allTokens[accountAddress][chainId];
        if (newAllTokens[chainId] === undefined) {
          newAllTokens[chainId] = { [accountAddress]: tokensArray };
        } else {
          newAllTokens[chainId] = {
            ...newAllTokens[chainId],
            [accountAddress]: tokensArray,
          };
        }
      });
    });
  }

  const ignoredTokens =
    migratedState.engine.backgroundState.TokensController.ignoredTokens;
  const newAllIgnoredTokens: Record<string, Record<string, unknown>> = {};
  Object.keys(allTokens).forEach((accountAddress) => {
    Object.keys(allTokens[accountAddress]).forEach((chainId) => {
      if (newAllIgnoredTokens[chainId] === undefined) {
        newAllIgnoredTokens[chainId] = {
          [accountAddress]: ignoredTokens,
        };
      } else {
        newAllIgnoredTokens[chainId] = {
          ...newAllIgnoredTokens[chainId],
          [accountAddress]: ignoredTokens,
        };
      }
    });
  });

  migratedState.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return migratedState;
}
