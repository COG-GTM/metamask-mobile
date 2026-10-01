type TokensByChain = Record<string, Record<string, unknown>>;

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        TokensController: {
          allTokens?: TokensByChain;
          ignoredTokens?: unknown;
          allIgnoredTokens?: TokensByChain;
        };
      };
    };
  };
  const allTokens =
    typedState.engine.backgroundState.TokensController.allTokens;
  const newAllTokens: TokensByChain = {};
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
  const newAllIgnoredTokens: TokensByChain = {};
  Object.keys(allTokens as TokensByChain).forEach((accountAddress) => {
    Object.keys((allTokens as TokensByChain)[accountAddress]).forEach(
      (chainId) => {
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
      },
    );
  });

  typedState.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return typedState;
}
