type TokensByChain = Record<string, unknown>;
type ByChainByAccount = Record<string, Record<string, unknown>>;

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens?: Record<string, TokensByChain>;
        ignoredTokens?: unknown;
        allIgnoredTokens?: ByChainByAccount;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  const allTokens = typedState.engine.backgroundState.TokensController
    .allTokens as Record<string, TokensByChain>;
  const newAllTokens: ByChainByAccount = {};
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
    typedState.engine.backgroundState.TokensController.ignoredTokens;
  const newAllIgnoredTokens: ByChainByAccount = {};
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

  typedState.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return typedState;
}
