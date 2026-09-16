type LegacyTokensByAccountAndChain = Record<string, Record<string, unknown>>;

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: LegacyTokensByAccountAndChain;
        ignoredTokens?: unknown;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(untypedState: unknown) {
  const state = untypedState as MigrationState;
  const allTokens = state.engine.backgroundState.TokensController.allTokens;
  const newAllTokens: LegacyTokensByAccountAndChain = {};
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
    state.engine.backgroundState.TokensController.ignoredTokens;
  const newAllIgnoredTokens: LegacyTokensByAccountAndChain = {};
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

  state.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return state;
}
