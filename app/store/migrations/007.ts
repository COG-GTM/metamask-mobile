type TokensByChain = Record<string, unknown[]>;
type TokensByAccount = Record<string, TokensByChain>;
type IgnoredTokensByAccount = Record<
  string,
  Record<string, unknown[] | undefined>
>;

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: TokensByAccount;
        ignoredTokens?: unknown[];
        allIgnoredTokens?: IgnoredTokensByAccount;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  const allTokens =
    typedState.engine.backgroundState.TokensController.allTokens;
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
    typedState.engine.backgroundState.TokensController.ignoredTokens;
  const newAllIgnoredTokens: IgnoredTokensByAccount = {};
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
