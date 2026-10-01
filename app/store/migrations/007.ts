type TokensByAccount = Record<string, Record<string, unknown>>;

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        TokensController: {
          allTokens: Record<string, Record<string, unknown>>;
          ignoredTokens: unknown;
          allIgnoredTokens?: TokensByAccount;
        };
      };
    };
  };

  const allTokens = typedState.engine.backgroundState.TokensController.allTokens;
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

  typedState.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  } as unknown as typeof typedState.engine.backgroundState.TokensController;

  return state as Record<string, unknown>;
}
