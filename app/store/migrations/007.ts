type TokensByChainId = Record<string, unknown>;
type TokensByAccount = Record<string, TokensByChainId>;

interface TokensControllerState {
  allTokens: TokensByAccount;
  allIgnoredTokens?: TokensByAccount;
  ignoredTokens?: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: TokensControllerState;
    };
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  const allTokens =
    migrationState.engine.backgroundState.TokensController.allTokens;
  const newAllTokens: TokensByAccount = {};
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
    migrationState.engine.backgroundState.TokensController.ignoredTokens;
  const newAllIgnoredTokens: TokensByAccount = {};
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

  migrationState.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return state;
}
